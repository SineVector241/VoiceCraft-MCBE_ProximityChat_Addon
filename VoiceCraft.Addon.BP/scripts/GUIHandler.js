import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Network } from "./Network/Network";
import { Player, world } from "@minecraft/server";
import {
  BitmaskLocations,
  BitmaskMap,
  BitmaskSettings,
  Channel,
} from "./Network/MCCommAPI";

class GUIHandler {
  /** @param {Network} network */
  constructor(network) {
    /** @type {Network} */
    this.Network = network;
  }
  static UIScreens = Object.freeze({
    MainPage: 1,
    ExternalSettingsChoicesPage: 2,
    ExternalSettingsPage: 3,
    InternalSettingsPage: 4,
    AutoConnectPage: 5,
    ChannelsPage: 6,
    PlayersPage: 7,
  });

  /**
   * @description Shows the UI to a player based on the page enum.
   * @argument {Number} page
   * @argument {Player} player
   */
  ShowUI(page, player) {
    switch (page) {
      case GUIHandler.UIScreens.MainPage:
        this.ShowMainPage(player);
        break;

      case GUIHandler.UIScreens.ExternalSettingsChoicesPage:
        this.ShowExternalSettingsChoice(player);
        break;

      case GUIHandler.UIScreens.ExternalSettingsPage:
        this.ShowExternalSettings(player);
        break;

      case GUIHandler.UIScreens.InternalSettingsPage:
        this.ShowInternalSettings(player);
        break;

      case GUIHandler.UIScreens.AutoConnectPage:
        this.ShowAutoConnect(player);
        break;

      case GUIHandler.UIScreens.ChannelsPage:
        this.ShowChannels(player);
        break;

      case GUIHandler.UIScreens.PlayersPage:
        this.ShowPlayers(player);
        break;
    }
  }

  /**
   * @description Shows the main page to a player.
   * @param {Player} player
   */
  ShowMainPage(player) {
    const page = new ActionFormData()
      .title("VoiceCraft Settings Panel")
      .button("External Server Settings")
      .button("Internal Server Settings")
      .button("Auto Connect Settings")
      .button("Auto Connect");

    page.show(player).then((result) => {
      if (result.canceled) return;

      switch (result.selection) {
        case 0:
          this.ShowUI(GUIHandler.UIScreens.ExternalSettingsChoicesPage, player);
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
          if (
            isEmptyOrSpaces(IP) ||
            isEmptyOrSpaces(ServerKey) ||
            Port === null
          ) {
            player.sendMessage(
              "§cError. Cannot connect. AutoConnect settings may not be setup properly!"
            );
            return;
          }

          player.sendMessage("§eConnecting/Linking Server...");
          this.Network.Connect(IP, Port, ServerKey)
            .then(() => {
              player.sendMessage(
                "§aLogin Accepted. Server successfully linked!"
              );
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
      }
    });
  }

  /**
   * @description Shows the external settings choices page to a player.
   * @param {Player} player
   */
  ShowExternalSettingsChoice(player) {
    if (!this.Network.IsConnected) {
      player.sendMessage(
        `§cCannot access external server settings, Server not connected/linked!`
      );
      return;
    }

    const page = new ActionFormData()
      .title("VoiceCraft External Settings")
      .button("Default Settings")
      .button("Channels")
      .button("Players");

    page.show(player).then((result) => {
      if (result.canceled) return;

      switch (result.selection) {
        case 0:
          this.ShowUI(GUIHandler.UIScreens.ExternalSettingsPage, player);
          break;
        case 1:
          this.ShowUI(GUIHandler.UIScreens.ChannelsPage, player);
          break;
        case 2:
          this.ShowUI(GUIHandler.UIScreens.PlayersPage, player);
      }
    });
  }

  /**
   * @description Shows the external settings page to a player.
   * @param {Player} player
   */
  ShowExternalSettings(player) {
    this.Network.GetDefaultSettings()
      .then((res) => {
        new ModalFormData()
          .title("External Server Settings")
          .slider("Proximity Distance", 1, 60, 1, res.ProximityDistance)
          .toggle("Proximity Enabled", res.ProximityToggle)
          .toggle("Voice Effects", res.VoiceEffects)
          .show(player)
          .then((response) => {
            if (response.canceled) return;
            player.sendMessage("§eUpdating Settings...");
            this.Network.SetDefaultSettings(
              response.formValues[0],
              response.formValues[1],
              response.formValues[2]
            )
              .then(() =>
                player.sendMessage(
                  "§2Successfully updated external server settings!"
                )
              )
              .catch((res) => {
                player.sendMessage(`§c${res}`);
              });
          });
      })
      .catch((res) => {
        player.sendMessage(`§c${res}`);
      });
  }

  /**
   * @description Shows the internal settings page to a player.
   * @param {Player} player
   */
  ShowInternalSettings(player) {
    new ModalFormData()
      .title("Internal Server Settings")
      .toggle(
        "Broadcast Participant Bind's",
        world.getDynamicProperty("sendBindedMessage")
      )
      .toggle(
        "Broadcast VOIP Disconnection",
        world.getDynamicProperty("broadcastVoipDisconnection")
      )
      .show(player)
      .then((results) => {
        if (results.canceled) return;

        const [BB, BVD] = results.formValues;

        world.setDynamicProperty("sendBindedMessage", BB);
        world.setDynamicProperty("broadcastVoipDisconnection", BVD);

        player.sendMessage("§2Successfully set internal server settings!");
      });
  }

  /**
   * @description Shows the autoconnect settings page to a player.
   * @param {Player} player
   */
  ShowAutoConnect(player) {
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
  }

  /**
   * @description Shows the channels page to a player.
   * @param {Player} player
   */
  ShowChannels(player) {
    this.Network.GetChannels()
      .then((res) => {
        const page = new ActionFormData().title("VoiceCraft Server Channels");
        for (const [key, value] of Object.entries(res)) {
          /** @type {Channel} */
          const channel = value;
          page.button(channel.Name);
        }
        page.show(player).then((result) => {
          if (result.canceled) return;

          this.ShowChannelSettings(
            player,
            result.selection,
            Object.entries(res)[result.selection][1]
          );
        });
      })
      .catch((res) => {
        player.sendMessage(`§c${res}`);
      });
  }

  /**
   * @description Shows a channel's settings to a player.
   * @param {Player} player
   * @param {Number} channelId
   * @param {Channel} channel
   */
  ShowChannelSettings(player, channelId, channel) {
    this.Network.GetChannelSettings(channelId)
      .then((res) => {
        const page = new ModalFormData()
          .title(`${channel.Name} Settings`)
          .slider("Proximity Distance", 1, 60, 1, res.ProximityDistance)
          .toggle("Proximity Enabled", res.ProximityToggle)
          .toggle("Voice Effects", res.VoiceEffects);

        page.show(player).then((result) => {
          if (result.canceled) return;

          const [PD, PE, VE] = result.formValues;
          this.Network.SetChannelSettings(channelId, PD, PE, VE)
            .then(() => {
              player.sendMessage("§2Successfully updated channel settings!");
            })
            .catch((reason) => {
              player.sendMessage(`§c${reason}`);
            });
        });
      })
      .catch((res) => {
        player.sendMessage(`§c${res}`);
      });
  }

  /**
   * @description Shows players page to a player.
   * @param {Player} player
   */
  ShowPlayers(player) {
    this.Network.GetParticipants().then((res) => {
      if(res.length <= 0)
      {
        player.sendMessage("§cNo players are connected to VoiceCraft.");
        return;
      }

      const page = new ActionFormData().title("Players");
      const players = world.getAllPlayers();

      for (const cPlayer of players) {
        if(res.includes(cPlayer.id))
          page.button(cPlayer.name);
      }
  
      page.show(player).then((result) => {
        if (result.canceled) return;
  
        this.ShowPlayerOptions(player, players[result.selection]);
      });
    })
    .catch((res) => {
      player.sendMessage(`§c${res}`);
    });
  }

  /**
   * @description Shows a players options to a player.
   * @param {Player} player
   * @param {Player} selectedPlayer
   */
  ShowPlayerOptions(player, selectedPlayer) {
    const page = new ActionFormData()
      .title(`${selectedPlayer.name} Options`)
      .button("Bitmask")
      .button("Mute")
      .button("Unmute")
      .button("Deafen")
      .button("Undeafen")
      .button("Kick");

    page.show(player).then((result) => {
      if (result.canceled) return;

      switch (result.selection) {
        case 0:
          this.ShowPlayerBitmaskOptions(player, selectedPlayer);
          break;
        case 1:
          this.Network.MutePlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully muted player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 2:
          this.Network.UnmutePlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully unmuted player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 3:
          this.Network.DeafenPlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully deafened player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 4:
          this.Network.UndeafenPlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully undeafened player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 5:
          this.Network.DisconnectPlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully disconnected player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
      }
    });
  }

  /**
   * @description Shows a players bitmask options.
   * @param {Player} player
   * @param {Player} selectedPlayer
   */
  ShowPlayerBitmaskOptions(player, selectedPlayer) {
    const page = new ActionFormData()
      .button("Bitmask1")
      .button("Bitmask2")
      .button("Bitmask3")
      .button("Bitmask4")
      .button("Bitmask5");

    page.show(player).then((result) => {
      if (result.canceled) return;

      switch (result.selection) {
        case 0:
          this.ShowBitmask1Settings(player, selectedPlayer);
          break;
        case 1:
          this.ShowBitmask2Settings(player, selectedPlayer);
          break;
        case 2:
          this.ShowBitmask3Settings(player, selectedPlayer);
          break;
        case 3:
          this.ShowBitmask4Settings(player, selectedPlayer);
          break;
        case 4:
          this.ShowBitmask5Settings(player, selectedPlayer);
          break;
      }
    });
  }

  /**
   * @description Shows a players bitmask1 settings.
   * @param {Player} player
   * @param {Player} selectedPlayer
   */
  ShowBitmask1Settings(player, selectedPlayer) {
    this.Network.GetPlayerBitmask(selectedPlayer)
      .then((res) => {
        const page = new ModalFormData()
          .title(`${selectedPlayer.name} Bitmask1 Settings`)
          .toggle("Talk Enabled", (res & BitmaskMap.TalkBitmask1) != 0)
          .toggle("Listen Enabled", (res & BitmaskMap.ListenBitmask1) != 0)
          .toggle(
            "Proximity Disabled",
            ((res >> BitmaskLocations.Bitmask1Settings) &
              BitmaskSettings.ProximityDisabled) !=
              0
          )
          .toggle(
            "Death Disabled",
            ((res >> BitmaskLocations.Bitmask1Settings) &
              BitmaskSettings.DeathDisabled) !=
              0
          )
          .toggle(
            "VoiceEffects Disabled",
            ((res >> BitmaskLocations.Bitmask1Settings) &
              BitmaskSettings.VoiceEffectsDisabled) !=
              0
          )
          .toggle(
            "Environment Disabled",
            ((res >> BitmaskLocations.Bitmask1Settings) &
              BitmaskSettings.EnvironmentDisabled) !=
              0
          );

        page.show(player).then((result) => {
          if(result.canceled) return;

          res &= ~(BitmaskMap.Bitmask1Settings | BitmaskMap.TalkBitmask1 | BitmaskMap.ListenBitmask1); //Reset all values we want to modify to 0.
          let settings = BitmaskSettings.None;
          const [TE, LE, PD, DD, VD, ED] = result.formValues;

          if(TE) res |= BitmaskMap.TalkBitmask1;
          if(LE) res |= BitmaskMap.ListenBitmask1;
          if(PD) settings |= BitmaskSettings.ProximityDisabled;
          if(DD) settings |= BitmaskSettings.DeathDisabled;
          if(VD) settings |= BitmaskSettings.VoiceEffectsDisabled;
          if(ED) settings |= BitmaskSettings.EnvironmentDisabled;
          settings <<= BitmaskLocations.Bitmask1Settings; //Move settings into position.
          res |= settings; //Set settings.

          this.Network.SetPlayerBitmask(selectedPlayer, res).then(() => {
            player.sendMessage("§2Successfully set player bitmask1 settings!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
        });
      })
      .catch((res) => {
        player.sendMessage(`§c${res}`);
      });
  }

  /**
   * @description Shows a players bitmask2 settings.
   * @param {Player} player
   * @param {Player} selectedPlayer
   */
  ShowBitmask2Settings(player, selectedPlayer) {
    this.Network.GetPlayerBitmask(selectedPlayer)
      .then((res) => {
        const page = new ModalFormData()
          .title(`${selectedPlayer.name} Bitmask2 Settings`)
          .toggle("Talk Enabled", (res & BitmaskMap.TalkBitmask2) != 0)
          .toggle("Listen Enabled", (res & BitmaskMap.ListenBitmask2) != 0)
          .toggle(
            "Proximity Disabled",
            ((res >> BitmaskLocations.Bitmask2Settings) &
              BitmaskSettings.ProximityDisabled) !=
              0
          )
          .toggle(
            "Death Disabled",
            ((res >> BitmaskLocations.Bitmask2Settings) &
              BitmaskSettings.DeathDisabled) !=
              0
          )
          .toggle(
            "VoiceEffects Disabled",
            ((res >> BitmaskLocations.Bitmask2Settings) &
              BitmaskSettings.VoiceEffectsDisabled) !=
              0
          )
          .toggle(
            "Environment Disabled",
            ((res >> BitmaskLocations.Bitmask2Settings) &
              BitmaskSettings.EnvironmentDisabled) !=
              0
          );

        page.show(player).then((result) => {
          if(result.canceled) return;
        });
      })
      .catch((res) => {
        player.sendMessage(`§c${res}`);
      });
  }

  /**
   * @description Shows a players bitmask3 settings.
   * @param {Player} player
   * @param {Player} selectedPlayer
   */
  ShowBitmask3Settings(player, selectedPlayer) {
    this.Network.GetPlayerBitmask(selectedPlayer)
      .then((res) => {
        const page = new ModalFormData()
          .title(`${selectedPlayer.name} Bitmask3 Settings`)
          .toggle("Talk Enabled", (res & BitmaskMap.TalkBitmask3) != 0)
          .toggle("Listen Enabled", (res & BitmaskMap.ListenBitmask3) != 0)
          .toggle(
            "Proximity Disabled",
            ((res >> BitmaskLocations.Bitmask3Settings) &
              BitmaskSettings.ProximityDisabled) !=
              0
          )
          .toggle(
            "Death Disabled",
            ((res >> BitmaskLocations.Bitmask3Settings) &
              BitmaskSettings.DeathDisabled) !=
              0
          )
          .toggle(
            "VoiceEffects Disabled",
            ((res >> BitmaskLocations.Bitmask3Settings) &
              BitmaskSettings.VoiceEffectsDisabled) !=
              0
          )
          .toggle(
            "Environment Disabled",
            ((res >> BitmaskLocations.Bitmask3Settings) &
              BitmaskSettings.EnvironmentDisabled) !=
              0
          );

        page.show(player).then((result) => {
          if(result.canceled) return;
        });
      })
      .catch((res) => {
        player.sendMessage(`§c${res}`);
      });
  }

  /**
   * @description Shows a players bitmask4 settings.
   * @param {Player} player
   * @param {Player} selectedPlayer
   */
  ShowBitmask4Settings(player, selectedPlayer) {
    this.Network.GetPlayerBitmask(selectedPlayer)
      .then((res) => {
        const page = new ModalFormData()
          .title(`${selectedPlayer.name} Bitmask4 Settings`)
          .toggle("Talk Enabled", (res & BitmaskMap.TalkBitmask4) != 0)
          .toggle("Listen Enabled", (res & BitmaskMap.ListenBitmask4) != 0)
          .toggle(
            "Proximity Disabled",
            ((res >> BitmaskLocations.Bitmask4Settings) &
              BitmaskSettings.ProximityDisabled) !=
              0
          )
          .toggle(
            "Death Disabled",
            ((res >> BitmaskLocations.Bitmask4Settings) &
              BitmaskSettings.DeathDisabled) !=
              0
          )
          .toggle(
            "VoiceEffects Disabled",
            ((res >> BitmaskLocations.Bitmask4Settings) &
              BitmaskSettings.VoiceEffectsDisabled) !=
              0
          )
          .toggle(
            "Environment Disabled",
            ((res >> BitmaskLocations.Bitmask4Settings) &
              BitmaskSettings.EnvironmentDisabled) !=
              0
          );

        page.show(player).then((result) => {
          if(result.canceled) return;
        });
      })
      .catch((res) => {
        player.sendMessage(`§c${res}`);
      });
  }

  /**
   * @description Shows a players bitmask5 settings.
   * @param {Player} player
   * @param {Player} selectedPlayer
   */
  ShowBitmask5Settings(player, selectedPlayer) {
    this.Network.GetPlayerBitmask(selectedPlayer)
      .then((res) => {
        const page = new ModalFormData()
          .title(`${selectedPlayer.name} Bitmask5 Settings`)
          .toggle("Talk Enabled", (res & BitmaskMap.TalkBitmask5) != 0)
          .toggle("Listen Enabled", (res & BitmaskMap.ListenBitmask5) != 0)
          .toggle(
            "Proximity Disabled",
            ((res >> BitmaskLocations.Bitmask5Settings) &
              BitmaskSettings.ProximityDisabled) !=
              0
          )
          .toggle(
            "Death Disabled",
            ((res >> BitmaskLocations.Bitmask5Settings) &
              BitmaskSettings.DeathDisabled) !=
              0
          )
          .toggle(
            "VoiceEffects Disabled",
            ((res >> BitmaskLocations.Bitmask5Settings) &
              BitmaskSettings.VoiceEffectsDisabled) !=
              0
          )
          .toggle(
            "Environment Disabled",
            ((res >> BitmaskLocations.Bitmask5Settings) &
              BitmaskSettings.EnvironmentDisabled) !=
              0
          );

        page.show(player).then((result) => {
          if(result.canceled) return;
        });
      })
      .catch((res) => {
        player.sendMessage(`§c${res}`);
      });
  }
}

function isEmptyOrSpaces(str) {
  return !str || str.match(/^ *$/) !== null;
}

export { GUIHandler };
