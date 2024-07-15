import { world, system, Player } from "@minecraft/server";
import { http } from "@minecraft/server-net";
import { Network } from "./Network";
import { Vec3 } from "../Utils/vec3";
import {
  Deny,
  PacketType,
  Update,
  AckUpdate,
  VoiceCraftPlayer,
} from "./MCCommAPI";

class NetworkRunner {
  /**
   * @param {Network} network
   */
  constructor(network) {
    /** @type {Network} */
    this.Network = network;
    /** @type {String[]} */
    this.DeadPlayers = [];
    /** @type {Number} */
    this.UpdateLoop = 0;
    /** @type {Number} */
    this.ReconnectRetries = 0;

    /** @type {String[]} */
    this.CaveBlocks = [
      "minecraft:stone",
      "minecraft:diorite",
      "minecraft:granite",
      "minecraft:deepslate",
      "minecraft:tuff",
    ];
  }

  /**
   * @description Starts the update looper.
   */
  Start() {
    this.UpdateLoop = system.runInterval(() => this.Update());
  }

  /**
   * @description Stops the update looper (does not set the Network.IsConnected field to false).
   */
  Stop() {
    if (this.UpdateLoop != 0) {
      system.clearRun(this.UpdateLoop); //clear the loop!
      this.UpdateLoop = 0;
    }
  }

  /**
   * @description Get's the cave density for a player based on the CaveBlocks list.
   * @param {Player} player
   * @returns {Float32Array}
   */
  GetCaveDensity(player) {
    if (!this.Network.IsConnected) return 0.0;

    const dimension = world.getDimension("overworld");
    const headLocation = player.getHeadLocation();
    try {
      let total = this.CaveBlocks.includes(
        dimension.getBlockFromRay(headLocation, Vec3.up, {
          maxDistance: 50,
        })?.block.type.id
      )
        ? 1
        : 0;
      total += this.CaveBlocks.includes(
        dimension.getBlockFromRay(headLocation, Vec3.left, {
          maxDistance: 20,
        })?.block.type.id
      )
        ? 1
        : 0;
      total += this.CaveBlocks.includes(
        dimension.getBlockFromRay(headLocation, Vec3.right, {
          maxDistance: 20,
        })?.block.type.id
      )
        ? 1
        : 0;
      total += this.CaveBlocks.includes(
        dimension.getBlockFromRay(headLocation, Vec3.forward, {
          maxDistance: 20,
        })?.block.type.id
      )
        ? 1
        : 0;
      total += this.CaveBlocks.includes(
        dimension.getBlockFromRay(headLocation, Vec3.backward, {
          maxDistance: 20,
        })?.block.type.id
      )
        ? 1
        : 0;
      total += this.CaveBlocks.includes(
        dimension.getBlockFromRay(headLocation, Vec3.down, {
          maxDistance: 50,
        })?.block.type.id
      )
        ? 1
        : 0;
      return total / 6;
    } catch(ex) {
      return 0.0;
    }
  }

  /**
   * @description Sends an update to the VoiceCraft server.
   * @returns {Promise<void>}
   */
  async Update() {
    if (this.Network.IsConnected) {
      try {
        //Build the list.
        const playerList = world.getAllPlayers().map((plr) => {
          const player = new VoiceCraftPlayer();
          player.PlayerId = plr.id;
          player.DimensionId = plr.dimension.id;
          player.Location = plr.getHeadLocation();
          player.Rotation = plr.getRotation().y;
          player.EchoFactor = this.GetCaveDensity(plr);
          player.Muffled = plr.dimension.getBlock(
            plr.getHeadLocation()
          )?.isLiquid;
          player.IsDead = this.DeadPlayers.includes(plr.id);
          return player;
        });

        //Build the packet.
        const packet = new Update();
        packet.Players = playerList;
        packet.Token = this.Network.Token;

        const response = await this.Network.SendPacket(packet);
        if (!this.Network.IsConnected) return; //Break out.

        if (response.PacketId == PacketType.AckUpdate) {
          /** @type {AckUpdate} */
          const packetData = response;
          //You can do stuff with the AckUpdate packet data here...
          return;
        } else if (response.PacketId == PacketType.Deny) {
          /** @type {Deny} */
          const packetData = response;
          this.Network.IsConnected = false;
          http.cancelAll(packetData.Reason);
          this.Stop();
        }
      } catch (ex) {
        if (!this.Network.IsConnected) return; //do nothing.

        console.warn("Lost Connection From VOIP Server."); //EZ
        this.Network.IsConnected = false;

        http.cancelAll("Lost Connection From VOIP Server.");
        system.clearRun(this.UpdateLoop);
        this.UpdateLoop = 0;

        if (world.getDynamicProperty("autoReconnect")) {
          if (world.getDynamicProperty("broadcastVoipDisconnection"))
            world.sendMessage(
              "§cLost Connection From VOIP Server. Attempting Reconnection..."
            );

          this.ReconnectRetries = 0;
          this.Reconnect();
          return;
        }

        if (world.getDynamicProperty("broadcastVoipDisconnection"))
          world.sendMessage("§cLost Connection From VOIP Server.");
      }
    } else if (this.UpdateLoop != 0) {
      this.Stop();
    }
  }

  Reconnect() {
    if (this.ReconnectRetries < 5) {
      this.ReconnectRetries++;

      console.warn(
        `Reconnecting to server... Attempt: ${this.ReconnectRetries}`
      );
      this.Network.Connect(
        this.Network.IPAddress,
        this.Network.Port,
        this.Network.Key
      )
        .then(() => {
          console.warn("Successfully reconnected to VOIP server.");

          if (world.getDynamicProperty("broadcastVoipDisconnection"))
            world.sendMessage("§aSuccessfully reconnected to VOIP server.");
        })
        .catch(() => {
          if (this.ReconnectRetries < 5) {
            console.warn("Connection failed, Retrying...");
            this.Reconnect();
            return;
          }
          console.error("Failed to reconnect to VOIP server.");

          if (world.getDynamicProperty("broadcastVoipDisconnection"))
            world.sendMessage("§cFailed to reconnect to VOIP server...");
        });
    }
  }
}

export { NetworkRunner };
