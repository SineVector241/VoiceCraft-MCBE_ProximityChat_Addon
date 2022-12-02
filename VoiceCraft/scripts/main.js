import { world } from "@minecraft/server";
import {
  http,
  HttpRequest,
  HttpRequestMethod,
  HttpHeader,
  HttpResponse,
} from "@minecraft/server-net";

var key = "";
var ip = "";
var linked = false;

world.events.beforeChat.subscribe((ev) => {
  if (ev.message.startsWith("!vclink")) {
    var params = ev.message.replace("!vclink ", "").split(" ");
    key = params[1];
    ip = params[0];
    ev.sender.tell("Requested Login");
    try {
      SendRequest(ev.sender);
    } catch {
      ev.sender.tell("§cAn error occured. Please check if the IP is correct.");
    }
    ev.cancel = true;
  }

  if(ev.message.startsWith("!vcreq"))
  {
    if(linked)
    {
        ev.sender.tell("Requested Session Key");
        SendSessionKeyRequest(ev.sender);
    }
    else
        ev.sender.tell("Could not request session key. Server not linked!");

    ev.cancel = true;
  }
});

function SendRequest(player) {
  var packet = {
    Type: 2,
    Key: key,
    PlayerId: "",
    Players: [],
  };

  var request = new HttpRequest(`http://${ip}/`)
    .setTimeout(5)
    .setBody(JSON.stringify(packet))
    .setMethod(HttpRequestMethod.POST)
    .setHeaders([new HttpHeader("Content-Type", "application/json")]);

  http.request(request).then((out) => {
    if (out.status == 202) {
      linked = true;
      player.tell("§aLogin Accepted. Server successfully linked!");
    } else {
      linked = false;
      player.tell("§cLogin Denied. Server denied link request!");
    }
  });
}

function SendSessionKeyRequest(player) {
    var packet = {
      Type: 0,
      Key: key,
      PlayerId: "",
      Players: [],
    };
  
    packet.PlayerId = player.id;
    var request = new HttpRequest(`http://${ip}/`)
      .setTimeout(5)
      .setBody(JSON.stringify(packet))
      .setMethod(HttpRequestMethod.POST)
      .setHeaders([new HttpHeader("Content-Type", "application/json")]);
  
    http.request(request).then((out) => {
      if (out.status == 200) {
        player.tell(`§aRequest Accepted. Your key is: ${out.body}`);
      } else {
        player.tell("§cConflict detected! Could not create new session key!");
      }
    });
  }

world.events.tick.subscribe((ev) => {
  try {
    var packet = {
      Type: 1,
      Key: key,
      PlayerId: "",
      Players: [],
    };
    if (linked) {
      var players = world.getAllPlayers();
      for (let i = 0; i < players.length; i++) {
        var player = {
          PlayerId: "",
          Location: {
            X: 0,
            Y: 0,
            Z: 0,
          },
        };

        player.Location.X = players[i].headLocation.x;
        player.Location.Y = players[i].headLocation.y;
        player.Location.Z = players[i].headLocation.z;
        player.PlayerId = players[i].id;
        packet.Players.push(player);
      }
      
      var request = new HttpRequest(`http://${ip}/`)
        .setTimeout(5)
        .setBody(JSON.stringify(packet))
        .setMethod(HttpRequestMethod.POST)
        .setHeaders([new HttpHeader("Content-Type", "application/json")]);

      http.request(request).then().catch(e => {
        linked = false;
      });
    }
  } catch {
    linked = false;
  }
});
