import PlayerAnimations from "shared/assets/animations/player";

export function playFallAnimation(character: Model): Promise<void> {
	return new Promise((resolve) => {
		const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
		if (!humanoid) {
			resolve();
			return;
		}

		let animator = character.FindFirstChild("Animator") as Animator;
		if (!animator) {
			animator = new Instance("Animator");
			animator.Parent = humanoid;
		}

		const animation = new Instance("Animation");
		animation.AnimationId = PlayerAnimations.Fall;

		const rootPart = character.FindFirstChild("HumanoidRootPart") as BasePart;

		if (!rootPart) {
			resolve();
			return;
		}

		rootPart.Anchored = true;

		const animTrack = animator.LoadAnimation(animation);

		animTrack.Play();
		animTrack.Stopped.Connect(() => {
			resolve();
		});

		task.delay(1.5, () => {
			resolve();
		});
	});
}
