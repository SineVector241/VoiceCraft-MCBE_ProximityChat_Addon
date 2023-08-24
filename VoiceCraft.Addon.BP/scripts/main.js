import { CommandSystem } from "./Commands/CommandSystem";
import { Network } from "./Network";
import {
  EntityInventoryComponent,
  ItemStack,
  world,
  system,
  DynamicPropertiesDefinition,
  Vector
} from "@minecraft/server";
import { GUIHandler } from "./GUIHandler";

CommandSystem.RegisterCommand(
  "connect",
  function (params) {
    Network.Connect(params.IP, params.PORT, params.Key, params.source);
  },
  {
    IP: "string",
    PORT: "integer",
    Key: "string",
  }
);

CommandSystem.RegisterCommand(
  "settings",
  function (params) {
    try {
      const component = params.source.getComponent(
        EntityInventoryComponent.componentId
      );
      const customItem = new ItemStack("minecraft:enchanted_book", 1);
      customItem.nameTag = "§bVoiceCraft Server Settings";
      customItem.setLore(["Open VoiceCraft Settings"]);
      component.container.addItem(customItem);
      params.source.sendMessage(
        "You have been given an item in your inventory. Right Click/Interact with the item to open the settings UI"
      );
    } catch (ex) {
      params.source.sendMessage(ex.toString());
    }
  },
  {}
);

CommandSystem.RegisterCommand(
  "bind",
  function (params) {
    params.source.sendMessage("§eBinding...");
    Network.RequestBinding(params.Key, params.source);
  },
  {
    Key: "integer",
  }
);

CommandSystem.RegisterCommand(
  "autoconnect",
  function (params) {
    const IP = world.getDynamicProperty("autoConnectIP");
    const Port = world.getDynamicProperty("autoConnectPort");
    const ServerKey = world.getDynamicProperty("autoConnectServerKey");
    if (isEmptyOrSpaces(IP) || isEmptyOrSpaces(ServerKey) || Port === null) {
      params.source.sendMessage(
        "§cError. Cannot connect. AutoBind settings may not be setup properly!"
      );
      return;
    }

    Network.Connect(IP, Port, ServerKey, params.source);
  },
  {}
);

CommandSystem.RegisterCommand(
  "help",
  function(params) {
    params.source.sendMessage("§bVoiceCraft Commands\n" + 
    "§g- connect [IP: string] [Port: integer] [Key: string] -> §bAttempts connection to a voicecraft server.\n" +
    "§g- settings -> §bGives you an item to access voicecraft settings panel/gui.\n" + 
    "§g- bind [Key: string] -> §bBinds the client running the command to a client connected to the voicecraft server.\n" + 
    "§g- autoconnect -> §bTakes the settings from the autoconnect settings and attempts connection.\n" + 
    "§g- help -> §bHelp command.");
  },
  {}
)

world.beforeEvents.itemUse.subscribe((ev) => {
  const player = ev.source;
  const item = ev.itemStack;
  system.run(() => {
    try {
      if (item.getLore()[0] == "Open VoiceCraft Settings") {
        GUIHandler.ShowUI(GUIHandler.UIScreens.MainPage, player);
      }
    } catch (ex) {
      player.sendMessage(ex.toString());
    }
  })
});

world.beforeEvents.chatSend.subscribe(ev => {
  if(world.getDynamicProperty("textProximityChat"))
  {
    ev.setTargets(world.getAllPlayers().filter(x => x.dimension.id === ev.sender.dimension.id && Vector.distance(x.location, ev.sender.location) <= world.getDynamicProperty("textProximityDistance")));
  }
});

world.afterEvents.entityDie.subscribe(ev => {
  if(ev.deadEntity.typeId == "minecraft:player")
  {
    Network.DeadPlayers.push(ev.deadEntity.id);
  }
});

world.afterEvents.playerSpawn.subscribe(ev => {
  for(let i = 0; i < Network.DeadPlayers.length; i++)
  {
    if(Network.DeadPlayers[i] == ev.player.id)
    {
      Network.DeadPlayers.splice(i, 1);
    }
  }
});

world.afterEvents.worldInitialize.subscribe((ev) => {
  const dynamicProperties = new DynamicPropertiesDefinition();
  dynamicProperties.defineString("autoConnectIP", 15);
  dynamicProperties.defineNumber("autoConnectPort");
  dynamicProperties.defineString("autoConnectServerKey", 36);
  dynamicProperties.defineNumber("textProximityDistance");
  dynamicProperties.defineBoolean("sendBindedMessage");
  dynamicProperties.defineBoolean("textProximityChat");
  dynamicProperties.defineBoolean("serverSettingsHudDisplay");
  dynamicProperties.defineBoolean("displayServerAddressOnHud");
  ev.propertyRegistry.registerWorldDynamicProperties(dynamicProperties);
});

function isEmptyOrSpaces(str) {
  return str === null || str.match(/^ *$/) !== null;
}
