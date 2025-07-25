import Net, { Definitions } from "@rbxts/net";
import { Powerups } from "shared/enums/game";
import { MapType } from "shared/enums/grid";
import { GameResultEntry, PlayerHealth, PlayerReadyData } from "shared/types/game";

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

	UI: Definitions.Namespace({
		PlayerReadyUpdate: Definitions.ServerToClientEvent<[playerData: PlayerReadyData[]]>(),
		PlayerHealthUpdate: Definitions.ServerToClientEvent<[playerHealth: PlayerHealth[]]>(),
		ShowResults: Definitions.ServerToClientEvent<[results: GameResultEntry[]]>(),
	}),

	Camera: Definitions.Namespace({
		CameraToMap: Definitions.ServerToClientEvent<[position: CFrame]>(),
		CameraToLobby: Definitions.ServerToClientEvent<[position: CFrame]>(),
	}),
});

export = Remotes;
