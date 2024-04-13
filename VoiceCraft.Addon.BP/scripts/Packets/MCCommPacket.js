class MCCommPacket {
    /** @argument {Number} packetId */
    constructor(packetId) {
        this.PacketId = packetId;
        this.Token = "";
    }
}

const PacketType = Object.freeze({
    Login: 0,
    Accept: 1,
    Deny: 2,
    Bind: 3,
    Update: 4,
    UpdateSettings: 5,
    GetSettings: 6,
    RemoveParticipant: 7,
    ChannelMove: 8,
    AcceptUpdate: 9
});

class Login extends MCCommPacket {
    constructor() {
        super(PacketType.Login);
        /** @type {String} */
        this.LoginKey = "";
    }
}

class Accept extends MCCommPacket {
    constructor()
    {
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

class AcceptUpdate extends MCCommPacket {
    constructor()
    {
        super(PacketType.AcceptUpdate);
        /** @type {String[]} */
        this.SpeakingPlayers = [];
    }
}

class UpdateSettings extends MCCommPacket {
    constructor() {
        super(PacketType.UpdateSettings);
        /** @type {Number} */
        this.ProximityDistance = 30;
        /** @type {Boolean} */
        this.ProximityToggle = false;
        /** @type {Boolean} */
        this.VoiceEffects = false;
    }
}

class GetSettings extends MCCommPacket {
    constructor()
    {
        super(PacketType.GetSettings);
    }
}

class RemoveParticipant extends MCCommPacket {
    constructor() {
        super(PacketType.RemoveParticipant);
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
        /** @type {Float32Array} */
        this.Rotation = 0.0;
        /** @type {Float32Array} */
        this.CaveDensity = 0.0;
        /** @type {Boolean} */
        this.IsDead = false;
        /** @type {Boolean} */
        this.InWater = false;
    }
}

export { PacketType, MCCommPacket, VoiceCraftPlayer, Login, Accept, Deny, Bind, Update, AcceptUpdate, UpdateSettings, GetSettings, RemoveParticipant, ChannelMove } 