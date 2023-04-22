import { CommandSystem } from './Commands/CommandSystem';
import { Network } from './Network';

CommandSystem.RegisterCommand("connect", function(params) {
    Network.Connect(params.IP, params.PORT, params.Key, params.source);
}, {
    IP: "string",
    PORT: "integer",
    Key: "string"
});

CommandSystem.RegisterCommand("bind", function(params) {
    params.source.sendMessage("§eBinding...");
    Network.RequestBinding(params.Key, params.source);
}, {
    Key: "string"
});