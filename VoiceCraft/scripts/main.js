import "./Commands";
import { Network } from "./Network";
import { States } from "./States";

var network = new Network();

world.events.tick.subscribe((ev) => {
  if (States.isConnected) {
    const playerList = world.getAllPlayers().map(plr => ({ PlayerId: plr.id, Location: { X: plr.headLocation.x, Y: plr.headLocation.y, Z: plr.headLocation.z } }));
    network.SendUpdatePacket(playerList);
  }
});
