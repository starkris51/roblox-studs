import Net, { Definitions } from "@rbxts/net";

const Remotes = Net.CreateDefinitions({
    Updates: Definitions.Namespace({
        Timer: Definitions.ServerToClientEvent<[time: number]>(),
        Score: Definitions.ServerToClientEvent<[score: number]>(),
    }),

    Game: Definitions.Namespace({
        Start: Definitions.ServerToClientEvent<[]>(),
        End: Definitions.ServerToClientEvent<[]>(),
        PlayerJoined: Definitions.ServerToClientEvent<[playerName: string]>(),
        PlayerLeft: Definitions.ServerToClientEvent<[playerName: string]>(),
    }),
});

export = Remotes;