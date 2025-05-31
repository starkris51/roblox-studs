import Net, { Definitions } from "@rbxts/net";
import { MapType } from "shared/enums/grid";

const Remotes = Net.CreateDefinitions({
	Actions: Definitions.Namespace({
		PlayerAttack: Definitions.ClientToServerEvent<[position: Vector3, direction: Vector3]>(),
		PlayerDash: Definitions.ClientToServerEvent<[position: Vector3, direction: Vector3]>(),
	}),

	Emotes: Definitions.Namespace({
		PlayerEmote: Definitions.ClientToServerEvent<[emoteName: string]>(),
		PlayerReaction: Definitions.ClientToServerEvent<[reactionEmoteName: string]>(),
	}),

	Voting: Definitions.Namespace({
		VoteMap: Definitions.ClientToServerEvent<[mapName: MapType]>(),
		UnvoteMap: Definitions.ClientToServerEvent<[mapName: MapType]>(),
		VoteGameMode: Definitions.ClientToServerEvent<[gameMode: string]>(),
		UnvoteGameMode: Definitions.ClientToServerEvent<[gameMode: string]>(),
	}),
});

export = Remotes;
