import Net, { Definitions } from "@rbxts/net";
import { PlayerDirection } from "shared/enums/player";

const Remotes = Net.CreateDefinitions({
    Actions: Definitions.Namespace({
        PlayerAttack: Definitions.ClientToServerEvent<[position: Vector3, direction: PlayerDirection]>(),
        PlayerDash: Definitions.ClientToServerEvent<[position: Vector3, direction: PlayerDirection]>(),
    }),

    Emotes: Definitions.Namespace({
        PlayerEmote: Definitions.ClientToServerEvent<[emoteName: string]>(),
        PlayerReaction: Definitions.ClientToServerEvent<[reactionEmoteName: string]>(),
    }),

    Voting: Definitions.Namespace({
        VoteMap: Definitions.ClientToServerEvent<[mapName: string]>(),
        UnvoteMap: Definitions.ClientToServerEvent<[mapName: string]>(),
        VoteGameMode: Definitions.ClientToServerEvent<[gameMode: string]>(),
        UnvoteGameMode: Definitions.ClientToServerEvent<[gameMode: string]>(),
    }),
});

export = Remotes;