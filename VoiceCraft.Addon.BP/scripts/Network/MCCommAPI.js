const PacketType = Object.freeze({
  Login: 0,
  Accept: 1,
  Deny: 2,
  Bind: 3,
  Update: 4,
  AckUpdate: 5,
  GetChannels: 6,
  GetChannelSettings: 7,
  SetChannelSettings: 8,
  GetDefaultSettings: 9,
  SetDefaultSettings: 10,

  //Participant Stuff
  DisconnectParticipant: 11,
  GetParticipantBitmask: 12,
  SetParticipantBitmask: 13,
  MuteParticipant: 14,
  UnmuteParticipant: 15,
  DeafenParticipant: 16,
  UndeafenParticipant: 17,
  ChannelMove: 18,
});

const ParticipantBitmask = Object.freeze({
  All: 65535, // 1111 1111 1111 1111
  None: 0, // 0000 0000 0000 0000
  DeathEnabled: 1, // 0000 0000 0000 0001
  ProximityEnabled: 2, // 0000 0000 0000 0010
  WaterEffectEnabled: 4, // 0000 0000 0000 0100
  EchoEffectEnabled: 8, // 0000 0000 0000 1000
  DirectionalEnabled: 16, // 0000 0000 0001 0000
  EnvironmentEnabled: 32, // 0000 0000 0010 0000

  HearingBitmask1: 64, // 0000 0000 0100 0000
  HearingBitmask2: 128, // 0000 0000 1000 0000
  HearingBitmask3: 256, // 0000 0001 0000 0000
  HearingBitmask4: 512, // 0000 0010 0000 0000
  HearingBitmask5: 1024, // 0000 0100 0000 0000

  TalkingBitmask1: 2048, // 0000 1000 0000 0000
  TalkingBitmask2: 4096, // 0001 0000 0000 0000
  TalkingBitmask3: 8192, // 0010 0000 0000 0000
  TalkingBitmask4: 16384, // 0100 0000 0000 0000
  TalkingBitmask5: 32768, // 1000 0000 0000 0000
});

class MCCommPacket {
  /** @argument {Number} packetId */
  constructor(packetId) {
    this.PacketId = packetId;
    this.Token = "";
  }
}

class Login extends MCCommPacket {
  constructor() {
    super(PacketType.Login);
    /** @type {String} */
    this.LoginKey = "";
  }
}

class Accept extends MCCommPacket {
  constructor() {
    super(PacketType.Accept);
  }
}

class Deny extends MCCommPacket {
  constructor() {
    super(PacketType.Deny);
    /** @type {String} */
    this.Reason = "";
  }
}

class Bind extends MCCommPacket {
  constructor() {
    super(PacketType.Bind);
    /** @type {String} */
    this.PlayerId = "";
    /** @type {Number} */
    this.PlayerKey = 0;
    /** @type {String} */
    this.Gamertag = "";
  }
}

class Update extends MCCommPacket {
  constructor() {
    super(PacketType.Update);
    /** @type {VoiceCraftPlayer[]} */
    this.Players = [];
  }
}

class AckUpdate extends MCCommPacket {
  constructor() {
    super(PacketType.AckUpdate);
    /** @type {String[]} */
    this.SpeakingPlayers = [];
  }
}

class GetChannels extends MCCommPacket {
  constructor() {
    super(PacketType.GetChannels);
    /** @type {Map<Number, Channel>} */
    this.Channels = new Map();
  }
}

class GetChannelSettings extends MCCommPacket {
  constructor() {
    super(PacketType.GetChannelSettings);
    /** @type {Number} */
    this.ChannelId = 0;
    /** @type {Number} */
    this.ProximityDistance = 30;
    /** @type {Boolean} */
    this.ProximityToggle = true;
    /** @type {Boolean} */
    this.VoiceEffects = true;
  }
}

class SetChannelSettings extends MCCommPacket {
  constructor() {
    super(PacketType.SetChannelSettings);
    /** @type {Number} */
    this.ChannelId = 0;
    /** @type {Number} */
    this.ProximityDistance = 30;
    /** @type {Boolean} */
    this.ProximityToggle = true;
    /** @type {Boolean} */
    this.VoiceEffects = true;
  }
}

class GetDefaultSettings extends MCCommPacket {
  constructor() {
    super(PacketType.GetDefaultSettings);
    /** @type {Number} */
    this.ProximityDistance = 30;
    /** @type {Boolean} */
    this.ProximityToggle = true;
    /** @type {Boolean} */
    this.VoiceEffects = true;
  }
}

class SetDefaultSettings extends MCCommPacket {
  constructor() {
    super(PacketType.SetDefaultSettings);
    /** @type {Number} */
    this.ProximityDistance = 30;
    /** @type {Boolean} */
    this.ProximityToggle = true;
    /** @type {Boolean} */
    this.VoiceEffects = true;
  }
}

class DisconnectParticipant extends MCCommPacket {
  constructor() {
    super(PacketType.DisconnectParticipant);
    /** @type {String} */
    this.PlayerId = "";
  }
}

class GetParticipantBitmask extends MCCommPacket {
  constructor() {
    super(PacketType.GetParticipantBitmask);
    /** @type {String} */
    this.PlayerId = "";
    /** @type {Number} */
    this.Bitmask = 0;
  }
}

class SetParticipantBitmask extends MCCommPacket {
  constructor() {
    super(PacketType.SetParticipantBitmask);
    /** @type {String} */
    this.PlayerId = "";
    /** @type {Number} */
    this.Bitmask = 0;
  }
}

class MuteParticipant extends MCCommPacket {
  constructor() {
    super(PacketType.MuteParticipant);
    /** @type {String} */
    this.PlayerId = "";
  }
}

class UnmuteParticipant extends MCCommPacket {
  constructor() {
    super(PacketType.UnmuteParticipant);
    /** @type {String} */
    this.PlayerId = "";
  }
}

class DeafenParticipant extends MCCommPacket {
  constructor() {
    super(PacketType.DeafenParticipant);
    /** @type {String} */
    this.PlayerId = "";
  }
}

class UndeafenParticipant extends MCCommPacket {
  constructor() {
    super(PacketType.UndeafenParticipant);
    /** @type {String} */
    this.PlayerId = "";
  }
}

class ChannelMove extends MCCommPacket {
  constructor() {
    super(PacketType.ChannelMove);
    /** @type {String} */
    this.PlayerId = "";
    /** @type {Number} */
    this.ChannelId = 0;
  }
}

class VoiceCraftPlayer {
  constructor() {
    /** @type {Number} */
    this.PlayerId = "";
    /** @type {Number} */
    this.DimensionId = "";
    /** @type {Vector3} */
    this.Location = { x: 0, y: 0, z: 0 };
    /** @type {Number} */
    this.Rotation = 0.0;
    /** @type {Number} */
    this.CaveDensity = 0.0;
    /** @type {Boolean} */
    this.IsDead = false;
    /** @type {Boolean} */
    this.InWater = false;
  }
}

class Channel {
  constructor() {
    /** @type {String} */
    this.Name = "";
    /** @type {String} */
    this.Password = "";
    /** @type {Boolean} */
    this.Locked = false;
    /** @type {Boolean} */
    this.Hidden = false;
    /** @type {ChannelOverride | undefined} */
    this.OverrideSettings = undefined;
  }
}

class ChannelOverride {
  constructor() {
    /** @type {Number} */
    this.ProximityDistance = 30;
    /** @type {Boolean} */
    this.ProximityToggle = true;
    /** @type {Boolean} */
    this.VoiceEffects = true;
  }
}

export {
  PacketType,
  ParticipantBitmask,
  MCCommPacket,
  Login,
  Accept,
  Deny,
  Bind,
  Update,
  AckUpdate,
  GetChannels,
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
  VoiceCraftPlayer,
  Channel,
  ChannelOverride,
};
