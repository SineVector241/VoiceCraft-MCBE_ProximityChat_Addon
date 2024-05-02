import {
  HttpRequestMethod,
  HttpHeader,
  HttpRequest,
  http,
  HttpResponse,
} from "@minecraft/server-net";
import {
  Login,
  Deny,
  MCCommPacket,
  PacketType,
  Update,
  UpdateSettings,
  VoiceCraftPlayer,
  AcceptUpdate,
  Bind,
  Accept,
  GetSettings,
} from "./Packets/MCCommPacket";
import { Player, system, world } from "@minecraft/server";
import { Vec3 } from "./vec3";

class Network {
  constructor() {
    /** @type {String} */
    this.IP = "";
    /** @type {Number} */
    this.Port = 9051;
    /** @type {String} */
    this.Key = "";
    /** @type {String} */
    this.Token = "";
    /** @type {Boolean} */
    this.IsConnected = false;
    /** @type {String[]} */
    this.DeadPlayers = [];

    /** @type {Number} */
    this.UpdateLoop = 0;
    /** @type {Number} */
    this.SettingsUpdateLoop = 0;

    /** @type {Number} */
    this.ProximityDistance = 0;
    /** @type {Boolean} */
    this.ProximityEnabled = true;
    /** @type {Boolean} */
    this.VoiceEffectEnabled = true;

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
   * @param {String} IP
   * @param {Number} Port
   * @param {String} Key
   */
  async Connect(IP, Port, Key) {
    if (Port < 0 || Port > 65535) throw "Invalid Port!";

    if (this.SettingsUpdateLoop != 0) {
      system.clearRun(this.SettingsUpdateLoop);
      this.SettingsUpdateLoop = 0;
    }
    if (this.UpdateLoop != 0) {
      this.IsConnected = false;
      system.clearRun(this.UpdateLoop);
      this.UpdateLoop = 0;
    }

    this.IP = IP;
    this.Port = Port;
    this.Key = Key;

    const packet = new Login();
    packet.LoginKey = Key;

    const response = await this.SendHttpRequest(packet);
    if (response.status == 200) {
      /** @type {MCCommPacket} */
      const responsePacket = JSON.parse(response.body);

      if (responsePacket.PacketId == PacketType.Accept) {
        /** @type {Accept} */
        const data = responsePacket;
        this.IsConnected = true;
        this.Token = data.Token;
        this.UpdateLoop = system.runInterval(() => this.Update());
        this.SettingsUpdateLoop = system.runInterval(
          () => this.SettingsUpdate(),
          20 * 5
        );
        return;
      } else {
        /** @type {Deny} */
        const data = responsePacket;
        throw `Login Denied. Server denied link request! Reason: ${data.Reason}`;
      }
    } else {
      this.IsConnected = false;
      throw "Could not contact server. Please check if your IP and PORT are correct!";
    }
  }

  /**
   * @param {String} Key
   * @param {Player} Player
   */
  async BindPlayer(Key, Player) {
    if (!this.IsConnected) throw "Could not bind, Server not linked!";

    const packet = new Bind();
    packet.Gamertag = Player.name;
    packet.PlayerKey = Key;
    packet.PlayerId = Player.id;
    packet.Token = this.Token;

    const response = await this.SendHttpRequest(packet);
    if (response.status == 200) {
      /** @type {MCCommPacket} */
      const responsePacket = JSON.parse(response.body);
      if (responsePacket.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const data = responsePacket;
        throw `Binding Unsuccessful. Reason: ${data.Reason}`;
      }
    } else {
      throw `Binding Unsuccessful. Reason: HTTP_EXCEPTION, STATUS_CODE: ${response.status}`;
    }
  }
  
  /**
   * @param {String} Key 
   * @param {String} Name 
   * @param {String} Id 
   */
  async BindFake(Key, Name, Id)
  {
    const packet = new Bind();
    packet.Gamertag = Name;
    packet.PlayerKey = Key;
    packet.PlayerId = Id;
    packet.Token = this.Token;

    const response = await this.SendHttpRequest(packet);
    if (response.status == 200) {
      /** @type {MCCommPacket} */
      const responsePacket = JSON.parse(response.body);
      if (responsePacket.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const data = responsePacket;
        throw `Binding Unsuccessful. Reason: ${data.Reason}`;
      }
    } else {
      throw `Binding Unsuccessful. Reason: HTTP_EXCEPTION, STATUS_CODE: ${response.status}`;
    }
  }

  /**
   * @param {String} Id
   * @param {Vector3} Location
   * @param {String} DimensionId
   */
  async UpdateFake(Id, Location, DimensionId)
  {
    const packet= new Update();
    const player = new VoiceCraftPlayer();
    player.PlayerId = Id;
    player.Location = Location;
    player.DimensionId = DimensionId;
    packet.Players = [ player ];
    packet.Token = this.Token;

    const response = await this.SendHttpRequest(packet);
    if (response.status == 200) {
      /** @type {MCCommPacket} */
      const responsePacket = JSON.parse(response.body);
      if (responsePacket.PacketId == PacketType.AcceptUpdate) {
        return;
      } else {
        /** @type {Deny} */
        const data = responsePacket;
        throw `Update Unsuccessful. Reason: ${data.Reason}`;
      }
    } else {
      throw `Update Unsuccessful. Reason: HTTP_EXCEPTION, STATUS_CODE: ${response.status}`;
    }
  }

  /**
   * @param {Number} ChannelId
   * @param {Player} Player
   */
  async ChannelMove(ChannelId, Player) {
    if (ChannelId < 1 || ChannelId > 255) throw "Invalid ChannelId!";
    if (!this.IsConnected) throw "Could not move channel, Server not linked!";

    const packet = new ChannelMove();
    packet.ChannelId = ChannelId;
    packet.PlayerId = PlayerObject.id;
    packet.Token = this.Token;

    const response = await this.SendHttpRequest(packet);
    if (response.status == 200) {
      /** @type {MCCommPacket} */
      const responsePacket = JSON.parse(response.body);
      if (responsePacket.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const data = responsePacket;
        throw `Could not switch channels. Reason: ${data.Reason}`;
      }
    } else {
      throw `Could not switch channels. Reason: HTTP_EXCEPTION, STATUS_CODE: ${response.status}`;
    }
  }

  /**
   * @param {Number} ProximityDistance
   * @param {Boolean} ProximityToggle
   * @param {Boolean} VoiceEffects
   */
  async UpdateSettings(ProximityDistance, ProximityToggle, VoiceEffects) {
    if (!this.IsConnected)
      throw "Could not update settings, Server not linked!";

    const packet = new UpdateSettings();
    packet.ProximityDistance = ProximityDistance;
    packet.ProximityToggle = ProximityToggle;
    packet.VoiceEffects = VoiceEffects;
    packet.Token = this.Token;

    const response = await this.SendHttpRequest(packet);
    if (response.status == 200) {
      /** @type {MCCommPacket} */
      const responsePacket = JSON.parse(response.body);
      if (responsePacket.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const data = responsePacket;
        throw `Could not update settings! Reason: ${data.Reason}`;
      }
    } else {
      throw `Could not update settings. Reason: HTTP_EXCEPTION, STATUS_CODE: ${response.status}`;
    }
  }

  /**
   * @returns {Promise<UpdateSettings>}
   */
  async GetSettings() {
    if (!this.IsConnected) throw "Could not get settings, Server not linked!";

    const packet = new GetSettings();
    packet.Token = this.Token;

    const response = await this.SendHttpRequest(packet);
    if (response.status == 200) {
      /** @type {MCCommPacket} */
      const responsePacket = JSON.parse(response.body);

      if (responsePacket.PacketId == PacketType.UpdateSettings) {
        /** @type {UpdateSettings} */
        return responsePacket;
      } else {
        /** @type {Deny} */
        const data = responsePacket;
        throw `Could not get settings, Reason: ${data.Reason}`;
      }
    } else {
      throw `Could not get settings, Reason: HTTP_EXCEPTION, STATUS_CODE: ${response.status}`;
    }
  }

  /**
   * @param {MCCommPacket} Packet
   * @returns {HttpResponse}
   */
  async SendHttpRequest(Packet) {
    const request = new HttpRequest(`http://${this.IP}:${this.Port}/`);
    request.setBody(JSON.stringify(Packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
    return await http.request(request);
  }

  /**
   * @param {Player} Player
   * @returns {Float32Array}
   */
  GetCaveDensity(Player) {
    if (!this.VoiceEffectEnabled && this.IsConnected) return 0.0;

    const dimension = world.getDimension("overworld");
    const block1 = this.CaveBlocks.includes(
      dimension.getBlockFromRay(Player.getHeadLocation(), Vec3.up, {
        maxDistance: 50,
      })?.block.type.id
    )
      ? 1
      : 0;
    const block2 = this.CaveBlocks.includes(
      dimension.getBlockFromRay(Player.getHeadLocation(), Vec3.left, {
        maxDistance: 20,
      })?.block.type.id
    )
      ? 1
      : 0;
    const block3 = this.CaveBlocks.includes(
      dimension.getBlockFromRay(Player.getHeadLocation(), Vec3.right, {
        maxDistance: 20,
      })?.block.type.id
    )
      ? 1
      : 0;
    const block4 = this.CaveBlocks.includes(
      dimension.getBlockFromRay(Player.getHeadLocation(), Vec3.forward, {
        maxDistance: 20,
      })?.block.type.id
    )
      ? 1
      : 0;
    const block5 = this.CaveBlocks.includes(
      dimension.getBlockFromRay(Player.getHeadLocation(), Vec3.backward, {
        maxDistance: 20,
      })?.block.type.id
    )
      ? 1
      : 0;
    const block6 = this.CaveBlocks.includes(
      dimension.getBlockFromRay(Player.getHeadLocation(), Vec3.down, {
        maxDistance: 50,
      })?.block.type.id
    )
      ? 1
      : 0;
    return (block1 + block2 + block3 + block4 + block5 + block6) / 6;
  }

  async Update() {
    if (this.IsConnected) {
      try {
        const playerList = world.getAllPlayers().map((plr) => {
          const player = new VoiceCraftPlayer();
          player.PlayerId = plr.id;
          player.DimensionId = plr.dimension.id;
          player.Location = plr.getHeadLocation();
          player.Rotation = plr.getRotation().y;
          player.CaveDensity =
            plr.dimension.id == "minecraft:overworld"
              ? this.GetCaveDensity(plr)
              : 0.0;
          player.IsDead = this.DeadPlayers.includes(plr.id);
          player.InWater = plr.dimension.getBlock(
            plr.getHeadLocation()
          )?.isLiquid;
          return player;
        });
        const packet = new Update();
        packet.Players = playerList;
        packet.Token = this.Token;

        const response = await this.SendHttpRequest(packet);
        if (response.status != 200 && this.IsConnected) {
          this.IsConnected = false;
          http.cancelAll("Lost Connection From VOIP Server.");
          if(world.getDynamicProperty("broadcastVoipDisconnection"))
            world.sendMessage("§cLost Connection From VOIP Server.");
          system.clearRun(this.UpdateLoop);
          this.UpdateLoop = 0;
          return;
        }

        /** @type {MCCommPacket} */
        const responsePacket = JSON.parse(response.body);
        if (responsePacket.PacketId == PacketType.Deny) {
          /** @type {Deny} */
          const packetData = responsePacket.PacketData;
          this.IsConnected = false;
          http.cancelAll(packetData.Reason);
          system.clearRun(this.UpdateLoop);
          this.UpdateLoop = 0;
          return;
        } else if (responsePacket == PacketType.AcceptUpdate) {
          /** @type {AcceptUpdate} */
          const data = responsePacket;
          //You can do stuff with the accept update packet data here...
        }
      } catch (ex) {
        if (this.IsConnected) console.warn(ex);
      }
    }
    try {
      if (world.getDynamicProperty("serverSettingsHudDisplay"))
        world
          .getDimension("minecraft:overworld")
          .runCommandAsync(
            `title @a actionbar §bServer Connection:` +
              `\n§bVoice Proximity: ${
                this.ProximityEnabled ? "§2Enabled" : "§cDisabled"
              }` +
              `\n§bVoice Effects: ${
                this.VoiceEffectEnabled ? "§2Enabled" : "§cDisabled"
              }` +
              `\n§bVoice Proximity Distance: §e${this.ProximityDistance}` +
              `${
                world.getDynamicProperty("displayServerAddressOnHud")
                  ? `\n\n§bServer Address: ${this.IP}:${this.Port}`
                  : ""
              }`
          );
    } catch {}
  }

  async SettingsUpdate() {
    if (this.IsConnected) {
      try {
        const packet = new GetSettings();
        packet.Token = this.Token;

        const response = await this.SendHttpRequest(packet);
        if (response.status == 200) {
          /** @type {MCCommPacket} */
          const responsePacket = JSON.parse(response.body);

          if (responsePacket.PacketId == PacketType.UpdateSettings) {
            /** @type {UpdateSettings} */
            const settings = responsePacket;

            this.ProximityDistance = settings.ProximityDistance;
            this.ProximityEnabled = settings.ProximityToggle;
            this.VoiceEffectEnabled = settings.VoiceEffects;
          }
        }
      } catch (ex) {}
    } else {
      system.clearRun(this.SettingsUpdateLoop);
      this.SettingsUpdateLoop = 0;
    }
  }
}
export { Network };
