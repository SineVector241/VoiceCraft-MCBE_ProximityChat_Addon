import { HttpRequestMethod, HttpHeader, HttpRequest, http } from '@minecraft/server-net';
import { world, system, Player } from '@minecraft/server';

class Network {
    static IsConnected = false;
    static IP = "";
    static Key = "";
    static Port = 0;

    /**
     * @argument {string} Ip
     * @argument {Number} Port
     * @argument {string} Key 
     * @argument {Player} PlayerObject
     */
    static Connect(Ip, Port, Key, PlayerObject) {
        this.IP = Ip;
        this.Port = Port;
        this.Key = Key;

        const packet = new Packet();
        packet.LoginKey = Key;
        packet.Type = 0;

        const request = new HttpRequest(`http://${this.IP}:${this.Port}/`);
        request.setTimeout(5);
        request.setBody(JSON.stringify(packet));
        request.setMethod(HttpRequestMethod.POST);
        request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
        http.request(request).then(response => {
            if (response.status == 200) {
                this.IsConnected = true;
                PlayerObject.sendMessage("§aLogin Accepted. Server successfully linked!");
            } else if(response.status == 3) {
                this.IsConnected = false;
                PlayerObject.sendMessage("§cCould not contact server. Please check if your IP and PORT are correct!");
            } else {
                this.IsConnected = false;
                PlayerObject.sendMessage("§cLogin Denied. Server denied link request!");
            }
        });
    }

    /**
     * @argument {string} Key
     * @argument {Player} PlayerObject
     */
    static RequestBinding(Key, PlayerObject) {
        if (!Network.IsConnected) {
            PlayerObject.sendMessage("§cCould not request session key. Server not linked!");
            return;
        }

        const packet = new Packet();
        packet.LoginKey = this.Key;
        packet.Type = 1;
        packet.Gamertag = PlayerObject.name;
        packet.PlayerKey = Key;
        packet.PlayerId = PlayerObject.id;

        const request = new HttpRequest(`http://${this.IP}:${this.Port}/`);
        request.setTimeout(5);
        request.setBody(JSON.stringify(packet));
        request.setMethod(HttpRequestMethod.POST);
        request.setHeaders([new HttpHeader("Content-Type", "application/json")]);
        http.request(request).then(response => {
            if (response.status == 202) {
                PlayerObject.sendMessage("§2Binded successfully!");
            }
            else {
                PlayerObject.sendMessage("§cBinding Unsuccessfull. Could not find binding key, key has already been binded to a participant or you are already binded!");
            }
        });
    }
}

class Packet {
    constructor() {
        this.Type = 0;
        this.LoginKey = "";
        this.PlayerId = "";
        this.PlayerKey = "";
        this.Gamertag = "";
        this.Players = [];
    }
}


system.runInterval(() => {
    if (Network.IsConnected) {
        const playerList = world.getAllPlayers().map(plr => ({ PlayerId: plr.id, DimensionId: plr.dimension.id, Location: { x: plr.getHeadLocation().x, y: plr.getHeadLocation().y, z: plr.getHeadLocation().z }, Rotation: plr.getRotation().y }));
        const packet = new Packet();
        packet.LoginKey = Network.Key;
        packet.Type = 2;
        packet.Players = playerList;

        const request = new HttpRequest(`http://${Network.IP}:${Network.Port}/`);
        request.setTimeout(5);
        request.setBody(JSON.stringify(packet));
        request.setMethod(HttpRequestMethod.POST);
        request.setHeaders([new HttpHeader("Content-Type", "application/json")]);

        http.request(request).then(response => {
            if (response.status != 200) {
                Network.IsConnected = false;
                http.cancelAll("Lost Connection From VOIP Server");
            }
        });
    }
});

export { Network }