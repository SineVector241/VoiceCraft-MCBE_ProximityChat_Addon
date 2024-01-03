class MCCommPacket
{
    constructor()
    {
        this.PacketType = PacketType.Null,
        this.PacketData = new Null();
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
    Null: 8
});

class Login
{
    constructor()
    {
        /** @type {String} */
        this.LoginKey = "";
    }
}

class Accept
{
}

class Deny
{
    constructor()
    {
        /** @type {String} */
        this.Reason = "";
    }
}

class Bind
{
    constructor()
    {
        /** @type {String} */
        this.PlayerId = "";
        /** @type {Number} */
        this.PlayerKey = 0;
        /** @type {String} */
        this.Gamertag = "";
    }
}

class Update
{
    constructor()
    {
        /** @type {VoiceCraftPlayer[]} */
        this.Players = [];
    }
}

class UpdateSettings
{
    constructor()
    {
        /** @type {Number} */
        this.ProximityDistance = 30;
        /** @type {Boolean} */
        this.ProximityToggle = false;
        /** @type {Boolean} */
        this.VoiceEffects = false;
    }
}

class GetSettings
{
}

class RemoveParticipant
{
    constructor()
    {
        /** @type {String} */
        this.PlayerId = "";
    }
}

class Null
{
}

class VoiceCraftPlayer
{
    constructor()
    {
        /** @type {Number} */
        this.PlayerId = "";
        /** @type {Number} */
        this.DimensionId = "";
        /** @type {Vector3} */
        this.Location = { x: 0, y: 0, z:0 };
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

export { PacketType, MCCommPacket, VoiceCraftPlayer, Login, Accept, Deny, Bind, Update, UpdateSettings, GetSettings, RemoveParticipant, Null } 