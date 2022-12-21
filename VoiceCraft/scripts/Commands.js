import { world } from "@minecraft/server";
import { Network } from "./Network";
import { States } from "./States";

var network = new Network();

world.events.beforeChat.subscribe((ev) => {
  if (ev.message.startsWith("!vclink")) {
    var params = ev.message.replace("!vclink ", "").split(" ");
    States.Key = params[1];
    States.Ip = params[0];

    ev.sender.tell("Requested Login");
    network.Login(ev.sender);

    ev.cancel = true;
  }

  if (ev.message.startsWith("!vcreq")) {
    if (States.isConnected) {
      ev.sender.tell("Requested Session Key");
      network.SendSessionKeyRequest(ev.sender);
    } else {
      ev.sender.tell("§cCould not request session key. Server not linked!");
    }

    ev.cancel = true;
  }
});