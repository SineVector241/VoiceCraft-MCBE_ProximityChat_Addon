import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Network } from "./Network/Network";
import { Player, world } from "@minecraft/server";
import { Channel, ParticipantBitmask } from "./Network/MCCommAPI";

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
    const page = new ActionFormData().title("Players");
    const players = world.getAllPlayers();
    for (const cPlayer of players) {
      page.button(cPlayer.name);
    }

    page.show(player).then((result) => {
      if (result.canceled) return;

      this.ShowPlayerOptions(player, players[result.selection]);
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
      .button("Mute")
      .button("Unmute")
      .button("Deafen")
      .button("Undeafen")
      .button("Kick")
      .button("Bitmask");

    page.show(player).then((result) => {
      if (result.canceled) return;

      switch (result.selection) {
        case 0:
          this.Network.MutePlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully muted player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 1:
          this.Network.UnmutePlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully unmuted player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 2:
          this.Network.DeafenPlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully deafened player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 3:
          this.Network.UndeafenPlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully undeafened player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 4:
          this.Network.DisconnectPlayer(selectedPlayer)
            .then(() => {
              player.sendMessage("§2Successfully disconnected player!");
            })
            .catch((res) => {
              player.sendMessage(`§c${res}`);
            });
          break;
        case 5:
          this.ShowPlayerBitmaskOptions(player, selectedPlayer);
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
    this.Network.GetPlayerBitmask(selectedPlayer)
      .then((res) => {
        const page = new ModalFormData()
          .title(`${selectedPlayer.name} Bitmask`)
          .toggle(
            "Death Enabled",
            (res & ParticipantBitmask.DeathEnabled) != 0
          )
          .toggle(
            "Proximity Enabled",
            (res & ParticipantBitmask.ProximityEnabled) != 0
          )
          .toggle(
            "Water Effect Enabled",
            (res & ParticipantBitmask.WaterEffectEnabled) != 0
          )
          .toggle(
            "Echo Effect Enabled",
            (res & ParticipantBitmask.EchoEffectEnabled) != 0
          )
          .toggle(
            "Directional Enabled",
            (res & ParticipantBitmask.DirectionalEnabled) != 0
          )
          .toggle(
            "Environment Enabled",
            (res & ParticipantBitmask.EnvironmentEnabled) != 0
          )
          .toggle(
            "Hearing Bitmask 1",
            (res & ParticipantBitmask.HearingBitmask1) != 0
          )
          .toggle(
            "Hearing Bitmask 2",
            (res & ParticipantBitmask.HearingBitmask2) != 0
          )
          .toggle(
            "Hearing Bitmask 3",
            (res & ParticipantBitmask.HearingBitmask3) != 0
          )
          .toggle(
            "Hearing Bitmask 4",
            (res & ParticipantBitmask.HearingBitmask4) != 0
          )
          .toggle(
            "Hearing Bitmask 5",
            (res & ParticipantBitmask.HearingBitmask5) != 0
          )
          .toggle(
            "Talking Bitmask 1",
            (res & ParticipantBitmask.TalkingBitmask1) != 0
          )
          .toggle(
            "Talking Bitmask 2",
            (res & ParticipantBitmask.TalkingBitmask2) != 0
          )
          .toggle(
            "Talking Bitmask 3",
            (res & ParticipantBitmask.TalkingBitmask3) != 0
          )
          .toggle(
            "Talking Bitmask 4",
            (res & ParticipantBitmask.TalkingBitmask4) != 0
          )
          .toggle(
            "Talking Bitmask 5",
            (res & ParticipantBitmask.TalkingBitmask5) != 0
          )
        page.show(player).then((result) => {
          if(result.canceled) return;

          let bitmask = ParticipantBitmask.None;
          const [DE, PR, WA, EC, DI, EN, H1, H2, H3, H4, H5, T1, T2, T3, T4, T5] = result.formValues;

          if(DE) bitmask = bitmask | ParticipantBitmask.DeathEnabled;
          if(PR) bitmask = bitmask | ParticipantBitmask.ProximityEnabled;
          if(WA) bitmask = bitmask | ParticipantBitmask.WaterEffectEnabled;
          if(EC) bitmask = bitmask | ParticipantBitmask.EchoEffectEnabled;
          if(DI) bitmask = bitmask | ParticipantBitmask.DirectionalEnabled;
          if(EN) bitmask = bitmask | ParticipantBitmask.EnvironmentEnabled;

          if(H1) bitmask = bitmask | ParticipantBitmask.HearingBitmask1;
          if(H2) bitmask = bitmask | ParticipantBitmask.HearingBitmask2;
          if(H3) bitmask = bitmask | ParticipantBitmask.HearingBitmask3;
          if(H4) bitmask = bitmask | ParticipantBitmask.HearingBitmask4;
          if(H5) bitmask = bitmask | ParticipantBitmask.HearingBitmask5;

          if(T1) bitmask = bitmask | ParticipantBitmask.TalkingBitmask1;
          if(T2) bitmask = bitmask | ParticipantBitmask.TalkingBitmask2;
          if(T3) bitmask = bitmask | ParticipantBitmask.TalkingBitmask3;
          if(T4) bitmask = bitmask | ParticipantBitmask.TalkingBitmask4;
          if(T5) bitmask = bitmask | ParticipantBitmask.TalkingBitmask5;

          this.Network.SetPlayerBitmask(selectedPlayer, bitmask).then(() => {
            player.sendMessage("§2Successfully set player bitmask!");
          })
          .catch((res) => {
            player.sendMessage(`§c${res}`);
          });
        })
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
