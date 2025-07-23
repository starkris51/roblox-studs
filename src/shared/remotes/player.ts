import Net, { Definitions } from "@rbxts/net";
import { Powerups } from "shared/enums/game";
import { MapType } from "shared/enums/grid";

const Remotes = Net.CreateDefinitions({
	Actions: Definitions.Namespace({
		PlayerAttack: Definitions.ClientToServerEvent<[position: Vector3, direction: Vector3]>(),
		PlayerDash: Definitions.ClientToServerEvent<[position: Vector3, direction: Vector3]>(),
		PlayerParry: Definitions.ClientToServerEvent<[position: Vector3, direction: Vector3]>(),
		PlayerUsePowerup: Definitions.ClientToServerEvent<[]>(),
		PlayerGotPowerup: Definitions.ServerToClientEvent<[powerupType: Powerups]>(),
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

	UI: Definitions.Namespace({
		PlayerToggleReady: Definitions.ServerAsyncFunction<() => boolean>(),
	}),

	Powerups: Definitions.Namespace({
		Speed: Definitions.ServerToClientEvent<[]>(),
		HP: Definitions.ServerToClientEvent<[]>(),
		Invisible: Definitions.ServerToClientEvent<[]>(),
		Dizzy: Definitions.ServerToClientEvent<[]>(),
	}),
});

export = Remotes;
