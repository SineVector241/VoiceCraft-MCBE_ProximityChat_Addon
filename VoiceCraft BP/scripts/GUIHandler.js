import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Network } from "./Network";
import { Player, world } from "@minecraft/server";

const MainPage = new ActionFormData()
  .title("VoiceCraft Settings Panel")
  .button("External Server Settings")
  .button("Internal Server Settings")
  .button("Auto Connect Settings")
  .button("Auto Connect");

class GUIHandler {
  static UIScreens = Object.freeze({
    MainPage: 1,
    ExternalSettingsPage: 2,
    InternalSettingsPage: 3,
    AutoConnectPage: 4,
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
              this.ShowUI(GUIHandler.UIScreens.ExternalSettingsPage, player);
              break;

            case 1:
              this.ShowUI(GUIHandler.UIScreens.InternalSettingsPage, player);
              break;

            case 2:
              this.ShowUI(GUIHandler.UIScreens.AutoConnectPage, player);
              break;

            case 3:
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
      case this.UIScreens.ExternalSettingsPage:
        Network.ShowSettings(player);
        break;

      case this.UIScreens.InternalSettingsPage:
        new ModalFormData()
          .title("Internal Server Settings")
          .toggle("Broadcast Participant Bind's", world.getDynamicProperty("sendBindedMessage"))
          .toggle("Server Settings Hud Display", world.getDynamicProperty("serverSettingsHudDisplay"))
          .toggle("Display Server Address On Hud", world.getDynamicProperty("displayServerAddressOnHud"))
          .toggle("Enable Text Proximity Chat", world.getDynamicProperty("textProximityChat"))
          .slider("Text Proximity Chat Distance", 1, 60, 1, world.getDynamicProperty("textProximityDistance"))
          .show(player)
          .then((results) => {
            if(results.canceled) return;

            const [ BB, SSHD, DSAOH, TPC, TPCD ] = results.formValues;

            world.setDynamicProperty("sendBindedMessage", BB);
            world.setDynamicProperty("displayServerAddressOnHud", DSAOH);
            world.setDynamicProperty("serverSettingsHudDisplay", SSHD);
            world.setDynamicProperty("textProximityChat", TPC);
            world.setDynamicProperty("textProximityDistance", TPCD);

            player.sendMessage(
              "§2Successfully set internal server settings!"
            );
          });
        break;

      case this.UIScreens.AutoConnectPage:
        const IP = world.getDynamicProperty("autoConnectIP");
        var Port = world.getDynamicProperty("autoConnectPort");
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
