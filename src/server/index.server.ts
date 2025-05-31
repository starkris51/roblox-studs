import { Players } from "@rbxts/services";
import PlayerAnimations from "shared/assets/animations/player";
import { GameManager } from "shared/classes/game";

Players.CharacterAutoLoads = false;

const gameManager = new GameManager();
gameManager.startLobby();

function onCharacterAdded(character: Model) {
	const humanoid = character.WaitForChild("Humanoid") as Humanoid;
	const animator = humanoid.WaitForChild("Animator") as Animator;

	for (const animation of animator.GetPlayingAnimationTracks()) {
		animation.Stop(0);
	}

	const animateScript = character.WaitForChild("Animate") as LocalScript;
	const idle = animateScript?.FindFirstChild("idle") as StringValue | undefined;
	const Animation1 = idle?.FindFirstChild("Animation1") as Animation | undefined;
	const Animation2 = idle?.FindFirstChild("Animation2") as Animation | undefined;
	if (Animation1) {
		Animation1.AnimationId = PlayerAnimations.Idle;
	}
	if (Animation2) {
		Animation2.AnimationId = PlayerAnimations.Idle;
	}
}

Players.PlayerAdded.Connect((player) => {
	player.CharacterAppearanceLoaded.Connect(onCharacterAdded);

	gameManager.playerJoin(player);
});

Players.PlayerRemoving.Connect((player) => {
	const gamePlayer = gameManager.getPlayer(player);
	if (!gamePlayer) {
		throw error(`Player ${player.Name} not found in gameManager`);
	}
	gameManager.playerLeave(gamePlayer);
});
