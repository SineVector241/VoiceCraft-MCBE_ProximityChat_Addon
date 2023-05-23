import { CommandSystem } from "./Commands/CommandSystem";
import { Network } from "./Network";
import { EntityInventoryComponent, ItemStack, world } from "@minecraft/server";

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
    Key: "string",
  }
);

world.events.beforeItemUse.subscribe((ev) => {
  try {
    if (ev.item.getLore()[0] == "Open VoiceCraft Settings") {
      Network.ShowSettings(ev.source);
    }
  } catch (ex) {
    ev.source.sendMessage(ex.toString());
  }
});
