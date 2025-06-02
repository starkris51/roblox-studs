import Net, { Definitions } from "@rbxts/net";
import { MapType } from "shared/enums/grid";
import { GameResultEntry } from "shared/types/game";

const Remotes = Net.CreateDefinitions({
	Timer: Definitions.Namespace({
		Start: Definitions.ServerToClientEvent<[timeLeft: number]>(),
		Tick: Definitions.ServerToClientEvent<[timeLeft: number]>(),
		End: Definitions.ServerToClientEvent<[]>(),
	}),

	Game: Definitions.Namespace({
		Lobby: Definitions.ServerToClientEvent<[]>(),
		Start: Definitions.ServerToClientEvent<[]>(),
		VoteMapSession: Definitions.ServerToClientEvent<[maps: MapType[]]>(),
		EndVoteMapSession: Definitions.ServerToClientEvent<[]>(),
		VoteGameModeSession: Definitions.ServerToClientEvent<[]>(),
		End: Definitions.ServerToClientEvent<[results: GameResultEntry[]]>(),
		PlayerJoined: Definitions.ServerToClientEvent<[playerName: string]>(),
		PlayerLeft: Definitions.ServerToClientEvent<[playerName: string]>(),
	}),

	Camera: Definitions.Namespace({
		CameraToMap: Definitions.ServerToClientEvent<[position: CFrame]>(),
		CameraToLobby: Definitions.ServerToClientEvent<[position: CFrame]>(),
	}),
});

export = Remotes;
