import {
  http,
  HttpRequest,
  HttpRequestMethod,
  HttpHeader,
  HttpResponse,
} from "@minecraft/server-net";

import { States } from "./States";

class Network {
  constructor() {
    this.States = States;
    //2 = Login Request, 1 = Update Player List, 0 = Create Session Key
    this.Packet = { Type: 0, Key: "", PlayerId: "", Username: "", Players: [] };
    this.Http = http;
  }

  Login(player) {
    //Setup Packet
    var packet = this.Packet;
    packet.Type = 2;
    packet.Key = this.States.Key;

    //Setup request.
    var request = new HttpRequest(`http://${this.States.Ip}/`)
      .setTimeout(5)
      .setBody(JSON.stringify(packet))
      .setMethod(HttpRequestMethod.POST)
      .setHeaders([new HttpHeader("Content-Type", "application/json")]);

    //Send Request and respond to player.
    this.Http.request(request).then((out) => {
      if (out.status == 202) {
        this.States.isConnected = true;
        player.tell("§aLogin Accepted. Server successfully linked!");
      } else {
        this.States.isConnected = false;
        player.tell("§cLogin Denied. Server denied link request!");
      }
    });
  }

  SendSessionKeyRequest(player) {
    //Setup Packet
    var packet = this.Packet;
    packet.Type = 0;
    packet.Username = player.name;
    packet.Key = this.States.Key;
    packet.PlayerId = player.id;

    //Setup request.
    var request = new HttpRequest(`http://${this.States.Ip}/`)
      .setTimeout(5)
      .setBody(JSON.stringify(packet))
      .setMethod(HttpRequestMethod.POST)
      .setHeaders([new HttpHeader("Content-Type", "application/json")]);

    //Send request and respond to player.
    this.Http.request(request).then((out) => {
      if (out.status == 200) {
        var addressInfo = this.States.Ip.split(":");
        player.tell(`§2Request Accepted. Your key is: ${out.body}\n-- VoiceCraft Information --\nIP: ${addressInfo[0]}\nPORT: ${addressInfo[1]}`);
      } else {
        player.tell("§cConflict detected! Could not create new session key! Please log off on VoiceCraft or wait 5 minutes before requesting a new session key.");
      }
    });
  }

  SendUpdatePacket(Players) {
    //Setup the packet;
    var packet = this.Packet;
    packet.Type = 1;
    packet.Players = Players;
    packet.Key = this.States.Key;

    //Setup request.
    var request = new HttpRequest(`http://${this.States.Ip}/`)
      .setTimeout(5)
      .setBody(JSON.stringify(packet))
      .setMethod(HttpRequestMethod.POST)
      .setHeaders([new HttpHeader("Content-Type", "application/json")]);

    //Send request.
    http.request(request).then((out) => {
      if (out.status != 202) this.States.isConnected = false;
    });
  }
}

export { Network };

/*
Player Packet

var player = {
    PlayerId: "",
    EnviromentId: "",
    Location: {
        X: 0,
        Y: 0,
        Z: 0,
      },
};
*/
