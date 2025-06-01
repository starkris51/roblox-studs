import PlayerAnimations from "shared/assets/animations/player";

export class AnimationController {
	private animator: Animator;
	private tracks = new Map<string, AnimationTrack>();

	constructor(animator: Animator) {
		this.animator = animator;

		// Replace default animations in the Animate script
		const humanoid = animator.Parent as Humanoid | undefined;
		const character = humanoid?.Parent as Model | undefined;
		const animateScript = character?.FindFirstChild("Animate") as LocalScript | undefined;

		if (animateScript) {
			const idle = animateScript.FindFirstChild("idle") as Folder | undefined;
			const walk = animateScript.FindFirstChild("walk") as Folder | undefined;

			if (idle) {
				const Animation1 = idle.FindFirstChild("Animation1") as Animation | undefined;
				const Animation2 = idle.FindFirstChild("Animation2") as Animation | undefined;
				if (Animation1) Animation1.AnimationId = PlayerAnimations.Idle;
				if (Animation2) Animation2.AnimationId = PlayerAnimations.Idle;
			}
			if (walk) {
				const Animation1 = walk.FindFirstChild("Animation1") as Animation | undefined;
				if (Animation1) Animation1.AnimationId = PlayerAnimations.Walk;
			}
		}
	}

	play(name: keyof typeof PlayerAnimations, fadeTime = 0.1): AnimationTrack {
		const id = PlayerAnimations[name];
		let track = this.tracks.get(name);

		if (!track) {
			const anim = new Instance("Animation");
			anim.AnimationId = id;
			track = this.animator.LoadAnimation(anim);
			this.tracks.set(name, track);
		}

		track.Stop(0);
		track.Play(fadeTime);
		return track;
	}

	stop(name: keyof typeof PlayerAnimations, fadeTime = 0.1) {
		const track = this.tracks.get(name);
		if (track) track.Stop(fadeTime);
	}

	stopAll(fadeTime = 0.1) {
		this.tracks.forEach((track) => track.Stop(fadeTime));
	}
}
