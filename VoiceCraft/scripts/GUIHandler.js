import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Network } from "./Network";
import { Player, world } from "@minecraft/server";

const MainPage = new ActionFormData()
  .title("VoiceCraft Settings Panel")
  .button("Server Settings")
  .button("Auto Connect Settings")
  .button("Auto Connect");

class GUIHandler {
  static UIScreens = Object.freeze({
    MainPage: 1,
    SettingsPage: 2,
    AutoConnectPage: 3,
  });

  /**
   * @argument {Number} page
   * @argument {Player} player
   */
  static ShowUI(page, player) {
    switch (page) {
      case this.UIScreens.MainPage:
        MainPage.show(player).then((result) => {
          switch (result.selection) {
            case 0:
              this.ShowUI(GUIHandler.UIScreens.SettingsPage, player);
              break;

            case 1:
              this.ShowUI(GUIHandler.UIScreens.AutoConnectPage, player);
              break;

            case 2:
              const IP = world.getDynamicProperty("autoConnectIP");
              const Port = world.getDynamicProperty("autoConnectPort");
              const ServerKey = world.getDynamicProperty("autoConnectServerKey");
              if (isEmptyOrSpaces(IP) || isEmptyOrSpaces(ServerKey) || Port === null) {
                player.sendMessage(
                  "§cError. Cannot connect. AutoConnect settings may not be setup properly!"
                );
                return;
              }

              Network.Connect(IP, Port, ServerKey, player);
              break;
          }
        });
        break;
      case this.UIScreens.SettingsPage:
        Network.ShowSettings(player);
        break;

      case this.UIScreens.AutoConnectPage:
        const IP = world.getDynamicProperty("autoConnectIP");
        const Port = world.getDynamicProperty("autoConnectPort");
        const ServerKey = world.getDynamicProperty("autoConnectServerKey");

        new ModalFormData()
          .title("Auto Connect Settings")
          .textField("IP Address", "127.0.0.1", IP)
          .textField("Port", "9050", Port ? Port.toString() : "")
          .textField("Server Key", "abc123", ServerKey)
          .show(player)
          .then((results) => {
            if (results.canceled) return;

            const [IP, Port, Key] = results.formValues;

            const portNum = Number.parseInt(Port);

            if (
              isEmptyOrSpaces(IP) ||
              isEmptyOrSpaces(Key) ||
              isNaN(portNum) ||
              portNum < 1025 ||
              portNum > 65535
            ) {
              player.sendMessage(
                "§cError. IP or Key cannot be empty! Port Number must also be between 1025 to 65535"
              );
              return;
            }

            try {
              world.setDynamicProperty("autoConnectIP", IP);
              world.setDynamicProperty("autoConnectPort", portNum);
              world.setDynamicProperty("autoConnectServerKey", Key);

              player.sendMessage(
                "§2Successfully set auto connect command settings!"
              );
            } catch (ex) {
              player.sendMessage(ex.toString());
            }
          });
        break;
    }
  }
}

function isEmptyOrSpaces(str) {
  return str === null || str.match(/^ *$/) !== null;
}

export { GUIHandler };
