import { CommandSystem } from "./Commands/CommandSystem";
import { Network } from "./Network/Network";
import {
  EntityInventoryComponent,
  ItemStack,
  world,
  system,
} from "@minecraft/server";
import { GUIHandler } from "./GUIHandler";

/** @type {Network} */
const Network = new Network();
const GUI = new GUIHandler(Network);

CommandSystem.RegisterCommand(
  "connect",
  function (params) {
    params.source.sendMessage("§eConnecting/Linking Server...");
    Network.Connect(params.IP, params.PORT, params.Key, params.source)
      .then(() => {
        params.source.sendMessage(
          "§aLogin Accepted. Server successfully linked!"
        );
      })
      .catch((res) => {
        params.source.sendMessage(`§c${res}`);
      });
  },
  {
    IP: "string",
    PORT: "integer",
    Key: "string",
  }
);

CommandSystem.RegisterCommand(
  "disconnect",
  function (params) {
    params.source.sendMessage("§eDisconnecting from Server...");
    if (!Network.IsConnected) {
      params.source.sendMessage("§cAlready disconnected from server.");
      return;
    }

    Network.Disconnect("Disconnection Request.").catch((res) => {
      params.source.sendMessage(`§c${res}`);
    });
  },
  {}
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
    Network.Bind(params.source, params.Key)
      .then(() => {
        params.source.sendMessage("§aBinding Successful!");
        if (world.getDynamicProperty("sendBindedMessage"))
          world.sendMessage(
            `§b${params.source.name} §2has connected to VoiceCraft!`
          );
      })
      .catch((res) => {
        params.source.sendMessage(`§c${res}`);
      });
  },
  {
    Key: "integer",
  }
);

CommandSystem.RegisterCommand(
  "bindfake",
  function (params) {
    params.source.sendMessage("§eBinding fake player...");
    Network.BindFake(params.Name, params.Key)
      .then(() => {
        params.source.sendMessage("§aBinding Successful!");
        if (world.getDynamicProperty("sendBindedMessage"))
          world.sendMessage(`§b${params.Name} §2has connected to VoiceCraft!`);
      })
      .catch((res) => {
        params.source.sendMessage(`§c${res}`);
      });
  },
  {
    Key: "integer",
    Name: "string",
  }
);

CommandSystem.RegisterCommand(
  "updatefake",
  function (params) {
    params.source.sendMessage("§eUpdating fake player...");
    Network.UpdateFake(params.Id, params.source)
      .then(() => {
        params.source.sendMessage("§aUpdate Successful!");
      })
      .catch((res) => {
        params.source.sendMessage(`§c${res}`);
      });
  },
  {
    Id: "string",
  }
);

CommandSystem.RegisterCommand(
  "autoconnect",
  function (params) {
    params.source.sendMessage("§eConnecting/Linking Server...");
    Network.AutoConnect()
      .then(() => {
        params.source.sendMessage(
          "§aLogin Accepted. Server successfully linked!"
        );
      })
      .catch((res) => {
        params.source.sendMessage(`§c${res}`);
      });
  },
  {}
);

CommandSystem.RegisterCommand(
  "setautobind",
  function (params) {
    try {
      params.source.setDynamicProperty("VCAutoBind", params.Key);
      params.source.sendMessage(
        `§2Successfully set autobind key to ${params.Key}`
      );
    } catch (ex) {
      params.source.sendMessage(`§cAn error occurred! Reason: ${ex}`);
    }
  },
  {
    Key: "integer",
  }
);

CommandSystem.RegisterCommand(
  "clearautobind",
  function (params) {
    try {
      params.source.setDynamicProperty("VCAutoBind", null);
      params.source.sendMessage(`§2Successfully cleared autobind!`);
    } catch (ex) {
      params.source.sendMessage(
        `§cError. Unable to clear autobind. Reason: ${ex}`
      );
    }
  },
  {}
);

CommandSystem.RegisterCommand(
  "help",
  function (params) {
    params.source.sendMessage(
      "§bVoiceCraft Commands\n" +
        "§g- connect [IP: string] [Port: integer] [Key: string] -> §bAttempts connection to a voicecraft server.\n" +
        "§g- disconnect -> §bDisconnects from the voicecraft server.\n" +
        "§g- settings -> §bGives you an item to access voicecraft settings panel/gui.\n" +
        "§g- bind [Key: string] -> §bBinds the client running the command to a client connected to the voicecraft server.\n" +
        "§g- autoconnect -> §bTakes the settings from the autoconnect settings and attempts connection.\n" +
        "§g- setautobind -> §bSets an auto bind tag for the player who ran the command.\n" +
        "§g- clearautobind -> §bClears the auto bind tag for the player who ran the command.\n" +
        "§g- help -> §bHelp command."
    );
  },
  {}
);

world.beforeEvents.itemUse.subscribe((ev) => {
  const player = ev.source;
  const item = ev.itemStack;
  system.run(() => {
    try {
      if (item.getLore()[0] == "Open VoiceCraft Settings") {
        GUI.ShowUI(GUIHandler.UIScreens.MainPage, player);
      }
    } catch (ex) {
      player.sendMessage(ex.toString());
    }
  });
});
