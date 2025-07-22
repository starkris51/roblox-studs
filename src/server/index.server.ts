import { Players, Workspace } from "@rbxts/services";
import { GameManager } from "shared/classes/game";

Players.CharacterAutoLoads = false;

const gameManager = new GameManager();

(async () => {
	try {
		await gameManager.initialize();
		print("Game successfully initialized!");
	} catch (error) {
		warn(`Failed to initialize game: ${error}`);
	}
})();

game.BindToClose(() => {
	print("Server shutting down...");

	gameManager.cleanup();

	print("Server shutdown complete");
});

Players.PlayerAdded.Connect((player) => {
	try {
		gameManager.playerJoin(player);
	} catch (error) {
		warn(`Error during player join for ${player.Name}: ${error}`);
	}
});

Players.PlayerRemoving.Connect((player) => {
	try {
		const gamePlayer = gameManager.getPlayer(player);
		if (gamePlayer !== undefined) {
			gameManager.playerLeave(gamePlayer);
		}
	} catch (error) {
		warn(`Error during player leave for ${player.Name}: ${error}`);
	}
});
