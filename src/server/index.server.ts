import { Players } from "@rbxts/services";
import { GameManager } from "shared/classes/game";

Players.CharacterAutoLoads = false;

const gameManager = new GameManager();
gameManager.startLobby();

Players.PlayerAdded.Connect((player) => {
	gameManager.playerJoin(player);
});

Players.PlayerRemoving.Connect((player) => {
	const gamePlayer = gameManager.getPlayer(player);
	if (!gamePlayer) {
		throw error(`Player ${player.Name} not found in gameManager`);
	}
	gameManager.playerLeave(gamePlayer);
});
