import Net, { Definitions } from "@rbxts/net";
import { MapType } from "shared/enums/grid";

const Remotes = Net.CreateDefinitions({
	Updates: Definitions.Namespace({
		Timer: Definitions.ServerToClientEvent<[time: number]>(),
		Score: Definitions.ServerToClientEvent<[score: number]>(),
	}),

	Game: Definitions.Namespace({
		Start: Definitions.ServerToClientEvent<[]>(),
		VoteMapSession: Definitions.ServerToClientEvent<[maps: MapType[]]>(),
		EndVoteMapSession: Definitions.ServerToClientEvent<[]>(),
		VoteGameModeSession: Definitions.ServerToClientEvent<[]>(),
		End: Definitions.ServerToClientEvent<[]>(),
		PlayerJoined: Definitions.ServerToClientEvent<[playerName: string]>(),
		PlayerLeft: Definitions.ServerToClientEvent<[playerName: string]>(),
	}),

	Camera: Definitions.Namespace({
		CameraToMap: Definitions.ServerToClientEvent<[position: CFrame]>(),
		CameraToLobby: Definitions.ServerToClientEvent<[position: CFrame]>(),
	}),
});

export = Remotes;
