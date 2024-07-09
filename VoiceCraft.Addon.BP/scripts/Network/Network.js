import {
  HttpRequestMethod,
  HttpHeader,
  HttpRequest,
  http,
} from "@minecraft/server-net";
import {
  PacketType,
  MCCommPacket,
  Login,
  Accept,
  Deny,
  Bind,
  Channel,
  GetChannels,
  ChannelOverride,
  GetChannelSettings,
  SetChannelSettings,
  GetDefaultSettings,
  SetDefaultSettings,
  DisconnectParticipant,
  GetParticipantBitmask,
  SetParticipantBitmask,
  MuteParticipant,
  UnmuteParticipant,
  DeafenParticipant,
  UndeafenParticipant,
  ChannelMove,
} from "./MCCommAPI";
import { NetworkRunner } from "./NetworkRunner";
import { world, Player } from "@minecraft/server";

class Network {
  constructor() {
    /** @type {String} */
    this.IPAddress = "";
    /** @type {Number} */
    this.Port = 9051;
    /** @type {String} */
    this.Key = "";
    /** @type {Boolean} */
    this.IsConnected = false;
    /** @type {NetworkRunner} */
    this.NetworkRunner = new NetworkRunner(this);
  }

  /**
   * @description Connects to a VoiceCraft server specified by the IPAddress and Port.
   * @param {String} ipAddress
   * @param {Number} port
   * @param {String} key
   * @returns {Promise<void>}
   */
  async Connect(ipAddress, port, key) {
    if (port < 0 || port > 65535) throw "Invalid Port!";

    this.Disconnect("Reconnecting to another server.");
    this.IPAddress = ipAddress;
    this.Port = port;
    this.Key = key;

    const packet = new Login();
    packet.LoginKey = key;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        /** @type {Accept} */
        const packetData = response;
        this.IsConnected = true;
        this.Token = packetData.Token;
        this.NetworkRunner.Start();
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Login Denied. Server denied link request! Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not contact server. Please check if your IPAddress and Port are correct! ERROR: ${ex}`;
    }
  }

  /**
   * @description Disconnects from a server with an optional reason.
   * @param {String} reason
   * @returns {Promise<void>}
   */
  async Disconnect(reason = "N.A.") {
    if (this.IsConnected) {
      this.NetworkRunner.Stop();
      this.IsConnected = false;
      if (world.getDynamicProperty("broadcastVoipDisconnection"))
        world.sendMessage(`§cDisconnected from VOIP Server, Reason: ${reason}`);
    }
  }

  /**
   * @description Binds a player to a VoiceCraft client.
   * @param {Player} player
   * @param {Number} key
   * @returns {Promise<void>}
   */
  async Bind(player, key) {
    if (!this.IsConnected) throw "Could not bind, Server not connected/linked!";

    const packet = new Bind();
    packet.Gamertag = player.name;
    packet.PlayerKey = key;
    packet.PlayerId = player.id;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Binding Unsuccessful, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Binding Unsuccessful, ERROR: ${ex}`;
    }
  }

  /**
   * @description Gets all the available channels from the VoiceCraft server
   * @returns {Promise<Map<Number, Channel>}
   */
  async GetChannels() {
    if (!this.IsConnected)
      throw "Could not retrive channels, Server not connected/linked!";

    const packet = new GetChannels();
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.GetChannels) {
        /** @type {GetChannels} */
        const packetData = response;
        return packetData.Channels;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not retrive channels, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not retrive channels, ERROR: ${ex}`;
    }
  }

  /**
   * @description Get's the settings for a channel, returns default/main settings if no override for the specified channel was set.
   * @param {Number} channelId
   * @returns {Promise<ChannelOverride>}
   */
  async GetChannelSettings(channelId) {
    if (!this.IsConnected)
      throw "Could not retreive channel settings, Server not connected/linked!";

    const packet = new GetChannelSettings();
    packet.ChannelId = channelId;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.GetChannelSettings) {
        /** @type {GetChannelSettings} */
        const packetData = response;
        const data = new ChannelOverride();

        data.ProximityDistance = packetData.ProximityDistance;
        data.ProximityToggle = packetData.ProximityToggle;
        data.VoiceEffects = packetData.VoiceEffects;
        return data;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not retreive channel settings, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not retreive channel settings, ERROR: ${ex}`;
    }
  }

  /**
   * @description Set's the settings for a channel.
   * @param {Number} channelId
   * @param {Number} proximityDistance
   * @param {Boolean} proximityToggle
   * @param {Boolean} voiceEffects
   * @returns {Promise<void>}
   */
  async SetChannelSettings(
    channelId,
    proximityDistance,
    proximityToggle,
    voiceEffects
  ) {
    if (!this.IsConnected)
      throw "Could not set channel settings, Server not connected/linked!";

    const packet = new SetChannelSettings();
    packet.ChannelId = channelId;
    packet.ProximityDistance = proximityDistance;
    packet.ProximityToggle = proximityToggle;
    packet.VoiceEffects = voiceEffects;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not set channel settings, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not set channel settings, ERROR: ${ex}`;
    }
  }

  /**
   * @description Get's the default settings.
   * @returns {Promise<ChannelOverride>}
   */
  async GetDefaultSettings() {
    if (!this.IsConnected)
      throw "Could not retreive default settings, Server not connected/linked!";

    const packet = new GetDefaultSettings();
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.GetDefaultSettings) {
        /** @type {GetDefaultSettings} */
        const packetData = response;
        const data = new ChannelOverride();

        data.ProximityDistance = packetData.ProximityDistance;
        data.ProximityToggle = packetData.ProximityToggle;
        data.VoiceEffects = packetData.VoiceEffects;
        return data;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not retreive default settings, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not retreive default settings, ERROR: ${ex}`;
    }
  }

  /**
   * @description Set's the default settings.
   * @param {Number} proximityDistance
   * @param {Boolean} proximityToggle
   * @param {Boolean} voiceEffects
   * @returns {Promise<void>}
   */
  async SetDefaultSettings(proximityDistance, proximityToggle, voiceEffects) {
    if (!this.IsConnected)
      throw "Could not set default settings, Server not connected/linked!";

    const packet = new SetDefaultSettings();
    packet.ProximityDistance = proximityDistance;
    packet.ProximityToggle = proximityToggle;
    packet.VoiceEffects = voiceEffects;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not set default settings, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not set default settings, ERROR: ${ex}`;
    }
  }

  /**
   * @description Disconnects a player from the VoiceCraft server.
   * @param {Player} player
   * @returns {Promise<void>}
   */
  async DisconnectPlayer(player) {
    if (!this.IsConnected)
      throw "Could not disconnect player, Server not connected/linked!";

    const packet = new DisconnectParticipant();
    packet.PlayerId = player.id;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not disconnect player, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not disconnect player, ERROR: ${ex}`;
    }
  }

  /**
   * @description Get's a player's VoiceCraft client bitmask.
   * @param {Player} player
   * @returns {Promise<Number>}
   */
  async GetPlayerBitmask(player) {
    if (!this.IsConnected)
      throw "Could not get player bitmask, Server not connected/linked!";

    const packet = new GetParticipantBitmask();
    packet.PlayerId = player.id;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.GetParticipantBitmask) {
        /** @type {GetParticipantBitmask} */
        const packetData = response;
        return packetData.Bitmask;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not get player bitmask, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not get player bitmask, ERROR: ${ex}`;
    }
  }

  /**
   * @description Set's a player's VoiceCraft client bitmask.
   * @param {Player} player
   * @param {Number} bitmask
   * @returns {Promise<void>}
   */
  async SetPlayerBitmask(player, bitmask) {
    if (!this.IsConnected)
      throw "Could not set player bitmask, Server not connected/linked!";

    const packet = new SetParticipantBitmask();
    packet.PlayerId = player.id;
    packet.Bitmask = bitmask;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not set player bitmask, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not set player bitmask, ERROR: ${ex}`;
    }
  }

  /**
   * @description Server Mutes a player's VoiceCraft client.
   * @param {Player} player
   * @returns {Promise<void>}
   */
  async MutePlayer(player) {
    if (!this.IsConnected)
      throw "Could not mute player, Server not connected/linked!";

    const packet = new MuteParticipant();
    packet.PlayerId = player.id;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not mute player, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not mute player, ERROR: ${ex}`;
    }
  }

  /**
   * @description Server Unmutes a player's VoiceCraft client.
   * @param {Player} player
   * @returns {Promise<void>}
   */
  async UnmutePlayer(player) {
    if (!this.IsConnected)
      throw "Could not unmute player, Server not connected/linked!";

    const packet = new UnmuteParticipant();
    packet.PlayerId = player.id;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not unmute player, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not unmute player, ERROR: ${ex}`;
    }
  }

  /**
   * @description Server Deafens a player's VoiceCraft client.
   * @param {Player} player
   * @returns {Promise<void>}
   */
  async DeafenPlayer(player) {
    if (!this.IsConnected)
      throw "Could not deafen player, Server not connected/linked!";

    const packet = new DeafenParticipant();
    packet.PlayerId = player.id;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not deafen player, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not deafen player, ERROR: ${ex}`;
    }
  }

  /**
   * @description Server Undeafens a player's VoiceCraft client.
   * @param {Player} player
   * @returns {Promise<void>}
   */
  async UndeafenPlayer(player) {
    if (!this.IsConnected)
      throw "Could not undeafen player, Server not connected/linked!";

    const packet = new UndeafenParticipant();
    packet.PlayerId = player.id;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not undeafen player, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not undeafen player, ERROR: ${ex}`;
    }
  }

  /**
   * @description Moves a player to a channel.
   * @param {Player} player
   * @param {Number} channelId
   */
  async ChannelMovePlayer(player, channelId) {
    if (!this.IsConnected)
      throw "Could not move player to channel, Server not connected/linked!";

    const packet = new ChannelMove();
    packet.PlayerId = player.id;
    packet.ChannelId = channelId;
    packet.Token = this.Token;

    try {
      const response = await this.SendPacket(packet);
      if (response.PacketId == PacketType.Accept) {
        return;
      } else {
        /** @type {Deny} */
        const packetData = response;
        throw `Could not move player to channel, Reason: ${packetData.Reason}`;
      }
    } catch (ex) {
      throw `Could not move player to channel, ERROR: ${ex}`;
    }
  }

  /**
   * @description Sends an MCCommPacket.
   * @param {MCCommPacket} Packet
   * @returns {Promise<MCCommPacket}
   */
  async SendPacket(packet) {
    const request = new HttpRequest(`http://${this.IPAddress}:${this.Port}/`);
    request.setBody(JSON.stringify(packet));
    request.setMethod(HttpRequestMethod.Post);
    request.setHeaders([new HttpHeader("Content-Type", "application/json")]);

    const response = await http.request(request);
    if (response.status == 200) {
      return JSON.parse(response.body);
    } else {
      throw `Sending HTTP Packet Failed, Reason: HTTP_EXCEPTION, STATUS_CODE: ${response.status}`;
    }
  }
}
export { Network };