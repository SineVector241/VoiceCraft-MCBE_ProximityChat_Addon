import {
  HttpRequestMethod,
  HttpHeader,
  HttpRequest,
  http,
} from "@minecraft/server-net";
import { world, system, Player, Vector } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { MCCommPacket, PacketType, Login, UpdateSettings, VoiceCraftPlayer, Update, Deny, Bind, ChannelMove } from "./Packets/MCCommPacket";

class Network {
  static IsConnected = false;
  static IP = "";
  static Key = "";
  static Port = 0;

  //External Server Settings
  static ProximityDistance = 0;
  static ProximityEnabled = true;
  static VoiceEffectEnabled = true;

  //Dead player detector
  static DeadPlayers = [];

  /**
   * @argument {string} Ip
   * @argument {Number} Port
   * @argument {string} Key
   * @argument {Player} PlayerObject
   */
  static Connect(Ip, Port, Key, PlayerObject) {
    PlayerObject.sendMessage("§eConnecting/Linking Server...");

    this.IP = Ip;
    this.Port = Port;
    this.Key = Key;

    const packetData = new Login();
    packetData.LoginKey = Key;

    const packet = new MCCommPacket();
    packet.PacketType = PacketType.Login;
    packet.PacketData = packetData;

    const request = new HttpRequest(`http://${this.IP}:${this.Port}/`);
    request.setTimeout(5);
    request.setBody(JSON.stringify(packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
    http.request(request).then((response) => {
      if (response.status == 200) {
        /** @type {MCCommPacket} */
        const json = JSON.parse(response.body);
        if (json.PacketType == PacketType.Accept) {
          this.IsConnected = true;
          PlayerObject.sendMessage(
            "§aLogin Accepted. Server successfully linked!"
          );
        } else if (json.PacketType == PacketType.Deny) {
          this.IsConnected = false;
          PlayerObject.sendMessage("§cLogin Denied. Server denied link request!");
        }
      } else {
        this.IsConnected = false;
        PlayerObject.sendMessage(
          "§cCould not contact server. Please check if your IP and PORT are correct!"
        );
      }
    });
  }

  /**
   * @argument {string} Key
   * @argument {Player} PlayerObject
   */
  static RequestBinding(Key, PlayerObject) {
    if (!Network.IsConnected) {
      PlayerObject.sendMessage(
        "§cCould not request session key. Server not linked!"
      );
      return;
    }

    const packetData = new Bind();
    packetData.Gamertag = PlayerObject.name;
    packetData.PlayerKey = Key;
    packetData.PlayerId = PlayerObject.id;

    const packet = new MCCommPacket();
    packet.PacketType = PacketType.Bind;
    packet.PacketData = packetData;

    const request = new HttpRequest(`http://${this.IP}:${this.Port}/`);
    request.setTimeout(5);
    request.setBody(JSON.stringify(packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
    http.request(request).then((response) => {
      if (response.status == 200) {
        /** @type {MCCommPacket} */
        const json = JSON.parse(response.body);
        if(json.PacketType == PacketType.Accept)
        {
          PlayerObject.sendMessage("§2Binded successfully!");
          if (world.getDynamicProperty("sendBindedMessage"))
            world.sendMessage(
              `§b${PlayerObject.name} §2has connected to VoiceCraft!`
            );
        }
        else {
          /** @type {Deny} */
          const packetData = json.PacketData;
          PlayerObject.sendMessage(
            `§cBinding Unsuccessfull. Reason: ${packetData.Reason}`
          );
        }
      }
      else
      {
        PlayerObject.sendMessage(
          "§cBinding Unsuccessfull. Reason: Unknown"
        );
      }
    });
  }

  /**
   * @argument {Number} ChannelId
   * @argument {Player} PlayerObject
   */
  static ChannelMove(ChannelId, PlayerObject) {
    if (!Network.IsConnected) {
      PlayerObject.sendMessage(
        "§cCould not request session key. Server not linked!"
      );
      return;
    }

    const packetData = new ChannelMove();
    packetData.ChannelId = ChannelId;
    packetData.PlayerId = PlayerObject.id;

    const packet = new MCCommPacket();
    packet.PacketType = PacketType.ChannelMove;
    packet.PacketData = packetData;

    const request = new HttpRequest(`http://${this.IP}:${this.Port}/`);
    request.setTimeout(5);
    request.setBody(JSON.stringify(packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
    http.request(request).then((response) => {
      if (response.status == 200) {
        /** @type {MCCommPacket} */
        const json = JSON.parse(response.body);
        if(json.PacketType == PacketType.Accept)
        {
          PlayerObject.sendMessage("§2Switched Successfully!");
        }
        else {
          /** @type {Deny} */
          const packetData = json.PacketData;
          PlayerObject.sendMessage(
            `§cSwitch Unsuccessfull. Reason: ${packetData.Reason}`
          );
        }
      }
      else
      {
        PlayerObject.sendMessage(
          "§cSwitch Unsuccessfull. Reason: Unknown"
        );
      }
    });
  }

  /**
   * @argument {Player} PlayerObject
   * @argument {number} ProximityDistance
   * @argument {boolean} ProximityToggle
   * @argument {boolean} VoiceEffects
   */
  static UpdateSettings(PlayerObject, ProximityDistance, ProximityToggle, VoiceEffects) {
    if (!Network.IsConnected) {
      PlayerObject.sendMessage(
        "§cCould not request settings update. Server not linked!"
      );
      return;
    }

    const packetData = new UpdateSettings();
    packetData.ProximityDistance = ProximityDistance;
    packetData.ProximityToggle = ProximityToggle;
    packetData.VoiceEffects = VoiceEffects;

    const packet = new MCCommPacket();
    packet.PacketType = PacketType.UpdateSettings;
    packet.PacketData = packetData;

    const request = new HttpRequest(`http://${this.IP}:${this.Port}/`);
    request.setTimeout(5);
    request.setBody(JSON.stringify(packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
    http.request(request).then((response) => {
      if (response.status == 200) {
        /** @type {MCCommPacket} */
        const json = JSON.parse(response.body);

        if (json.PacketType == PacketType.Accept) {
          PlayerObject.sendMessage(
            "§2Successfully set external server settings!"
          );
        } else {
          PlayerObject.sendMessage(
            "§cAn error occured! Could not update settings!"
          );
        }
      }
    });
  }

  /**
   * @argument {Player} PlayerObject
   */
  static ShowSettings(PlayerObject) {
    if (!Network.IsConnected) {
      PlayerObject.sendMessage(
        "§cCould not request settings. Server not linked!"
      );
      return;
    }

    const packet = new MCCommPacket();
    packet.PacketType = PacketType.GetSettings;

    const request = new HttpRequest(`http://${this.IP}:${this.Port}/`);
    request.setTimeout(5);
    request.setBody(JSON.stringify(packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
    http.request(request).then((response) => {
      if (response.status == 200) {
        /** @type {MCCommPacket} */
        const json = JSON.parse(response.body);

        if (json.PacketType == PacketType.UpdateSettings) {
          /** @type {UpdateSettings} */
          const settings = json.PacketData;
          new ModalFormData()
            .title("External Server Settings")
            .slider("Proximity Distance", 1, 60, 1, settings.ProximityDistance)
            .toggle("Proximity Enabled", settings.ProximityToggle)
            .toggle("Voice Effects", settings.VoiceEffects)
            .show(PlayerObject)
            .then((response) => {
              if (response.canceled) return;
              this.UpdateSettings(
                PlayerObject,
                response.formValues[0],
                response.formValues[1],
                response.formValues[2]
              );
            });
        }
      } else {
        PlayerObject.sendMessage("§cAn error occured!");
      }
    });
  }
}

/**
 * @argument {Player} player
 */
function GetCaveDensity(player) {
  if (!Network.VoiceEffectEnabled && Network.IsConnected) return 0.0;
  const caveBlocks = ["minecraft:stone",
    "minecraft:diorite",
    "minecraft:granite",
    "minecraft:deepslate",
    "minecraft:tuff"]

  const dimension = world.getDimension("overworld");
  const block1 = caveBlocks.includes(dimension.getBlockFromRay(player.getHeadLocation(), Vector.up, { maxDistance: 50 })?.block.type.id) ? 1 : 0;
  const block2 = caveBlocks.includes(dimension.getBlockFromRay(player.getHeadLocation(), Vector.left, { maxDistance: 20 })?.block.type.id) ? 1 : 0;
  const block3 = caveBlocks.includes(dimension.getBlockFromRay(player.getHeadLocation(), Vector.right, { maxDistance: 20 })?.block.type.id) ? 1 : 0;
  const block4 = caveBlocks.includes(dimension.getBlockFromRay(player.getHeadLocation(), Vector.forward, { maxDistance: 20 })?.block.type.id) ? 1 : 0;
  const block5 = caveBlocks.includes(dimension.getBlockFromRay(player.getHeadLocation(), Vector.back, { maxDistance: 20 })?.block.type.id) ? 1 : 0;
  const block6 = caveBlocks.includes(dimension.getBlockFromRay(player.getHeadLocation(), Vector.down, { maxDistance: 50 })?.block.type.id) ? 1 : 0;
  return (block1 + block2 + block3 + block4 + block5 + block6) / 6;
}

system.runInterval(() => {
  if (Network.IsConnected) {
    const playerList = world
      .getAllPlayers()
      .map((plr) => {
        const player = new VoiceCraftPlayer();
        player.PlayerId = plr.id;
        player.DimensionId = plr.dimension.id;
        player.Location = plr.getHeadLocation();
        player.Rotation = plr.getRotation().y;
        player.CaveDensity = plr.dimension.id == "minecraft:overworld" ? GetCaveDensity(plr) : 0.0;
        player.IsDead = Network.DeadPlayers.includes(plr.id);
        player.InWater = plr.dimension.getBlock(plr.getHeadLocation())?.isLiquid;
        return player;
      });
    const packetData = new Update();
    packetData.Players = playerList;

    const packet = new MCCommPacket();
    packet.PacketType = PacketType.Update;
    packet.PacketData = packetData;

    const request = new HttpRequest(`http://${Network.IP}:${Network.Port}/`);
    request.setTimeout(5);
    request.setBody(JSON.stringify(packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);

    http.request(request).then((response) => {
      if (response.status != 200) {
        Network.IsConnected = false;
        http.cancelAll("Lost Connection From VOIP Server");
        return;
      }

      /** @type {MCCommPacket} */
      const json = JSON.parse(response.body);
      if (json.PacketType == PacketType.Deny) {
        /** @type {Deny} */
        const packetData = json.PacketData;
        Network.IsConnected = false;
        http.cancelAll(packetData.Reason);
        return;
      }
    });
  }
  try {
    if (world.getDynamicProperty("serverSettingsHudDisplay"))
      world
        .getDimension("minecraft:overworld")
        .runCommandAsync(
          `title @a actionbar §bServer Connection: ${Network.IsConnected ? "§aConnected" : "§cDisconnected"
          }` +
          `\n§bVoice Proximity: ${Network.ProximityEnabled ? "§2Enabled" : "§cDisabled"
          }` +
          `\n§bVoice Effects: ${Network.VoiceEffectEnabled ? "§2Enabled" : "§cDisabled"
          }` +
          `\n§bVoice Proximity Distance: §e${Network.ProximityDistance}` +
          `\n\n§bText Proximity: ${world.getDynamicProperty("textProximityChat")
            ? "§2Enabled"
            : "§cDisabled"
          }` +
          `\n§bText Proximity Distance: §e${world.getDynamicProperty(
            "textProximityDistance"
          )}` +
          `${world.getDynamicProperty("displayServerAddressOnHud")
            ? `\n\n§bServer Address: ${Network.IP}:${Network.Port}`
            : ""
          }`
        );
  } catch { }
});

system.runInterval(() => {
  if (Network.IsConnected) {
    const packet = new MCCommPacket();
    packet.PacketType = PacketType.GetSettings;

    const request = new HttpRequest(`http://${Network.IP}:${Network.Port}/`);
    request.setTimeout(5);
    request.setBody(JSON.stringify(packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
    http.request(request).then((response) => {
      if (response.status == 200) {
        /** @type {MCCommPacket} */
        const json = JSON.parse(response.body);

        if (json.PacketType == PacketType.UpdateSettings) {
          /** @type {UpdateSettings} */
          const settings = json.PacketData;

          Network.ProximityDistance = settings.ProximityDistance;
          Network.ProximityEnabled = settings.ProximityToggle;
          Network.VoiceEffectEnabled = settings.VoiceEffects;
        }
      }
    });
  }
}, 20 * 5);

export { Network };