import { Players, UserInputService, RunService } from "@rbxts/services";
import { AnimationController } from "shared/classes/animation";
import Remotes from "shared/remotes/player";

const player = Players.LocalPlayer;
const character = player.Character || player.CharacterAdded.Wait()[0];
const humanoid = character.WaitForChild("Humanoid") as Humanoid;
const rootPart = character.WaitForChild("HumanoidRootPart") as BasePart;
const animator = humanoid.WaitForChild("Animator") as Animator;
const animationController = new AnimationController(animator);

const MOVE_SPEED = 20;

humanoid.JumpPower = 0;
humanoid.JumpHeight = 0;
humanoid.AutoJumpEnabled = false;
humanoid.AutoRotate = false;
humanoid.WalkSpeed = MOVE_SPEED;

let canDash = true;
let dashCooldownTimer: thread | undefined;
let dashing = false;
const dashDuration = 0.2;
const dashCooldown = 1.5;

let isAttacking = false;

const actions = Remotes.Client.GetNamespace("Actions");
const powerups = Remotes.Client.GetNamespace("Powerups");
const playerAttack = actions.Get("PlayerAttack");

const speedPowerupReceived = powerups.Get("Speed");
const invisiblePowerupReceived = powerups.Get("Invisible");
const slowDown = powerups.Get("Slowdown");
const Dizzy = powerups.Get("Dizzy");
const shieldReceived = powerups.Get("Shield");
const disableAttack = powerups.Get("DisableAttack");

let keyDirectionMap: Record<string, Vector3> = {
	w: new Vector3(0, 0, -1),
	a: new Vector3(-1, 0, 0),
	s: new Vector3(0, 0, 1),
	d: new Vector3(1, 0, 0),
};

const heldKeys = new Set<string>();
let currentDirection = new Vector3(0, 0, -1);
const dashSpeed = 100;

let isDizzy = false;
let isAttackDisabled = false;

function moveAndFace(direction: Vector3) {
	currentDirection = direction;

	const actualMoveDirection = isDizzy ? direction.mul(-1) : direction;

	rootPart.CFrame = CFrame.lookAt(rootPart.Position, rootPart.Position.add(actualMoveDirection));
	humanoid.Move(actualMoveDirection, true);
}

function onInputBegan(input: InputObject, processed: boolean) {
	if (processed) return;
	const key = input.KeyCode.Name.lower();
	if (keyDirectionMap[key]) {
		heldKeys.add(key);
	}
	if (input.KeyCode === Enum.KeyCode.Space && !isAttacking && !isAttackDisabled) {
		isAttacking = true;
		humanoid.WalkSpeed = 0; // Stop movement during attack
		const attackTrack = animationController.play("Attack");
		attackTrack.Stopped.Once(() => {
			isAttacking = false;
			humanoid.WalkSpeed = MOVE_SPEED;
		});
		wait(0.25); // Wait for the kick animation to finish
		playerAttack.SendToServer(rootPart.Position, new Vector3(currentDirection.X, 0, currentDirection.Z));
	}

	if (input.KeyCode === Enum.KeyCode.LeftShift) {
		if (!canDash || dashing || isAttacking) return;

		dashing = true;
		canDash = false;

		const dashTrack = animationController.play("Dash");

		const dashDirection = currentDirection.Unit;

		rootPart.ApplyImpulse(dashDirection.mul(dashSpeed * 10));

		task.delay(dashDuration, () => {
			if (rootPart) {
				rootPart.AssemblyLinearVelocity = new Vector3(0, 0, 0);
			}
			dashing = false;
		});

		dashCooldownTimer = task.delay(dashCooldown, () => {
			canDash = true;
		});
	}
	// if (input.KeyCode === Enum.KeyCode.E) {
	// 	if (dashing || isAttacking) return;
	// 	//const parryTrack = animationController.play("Parry");
	// 	// parryTrack.Stopped.Once(() => {
	// 	// 	isAttacking = false;
	// 	// });
	// 	print("Parry action triggered");
	// 	playerAttack.SendToServer(rootPart.Position, new Vector3(currentDirection.X, 0, currentDirection.Z));
	// }
	if (input.KeyCode === Enum.KeyCode.Q) {
		if (dashing || isAttacking) return;
		//const powerupTrack = animationController.play("Powerup");
		// powerupTrack.Stopped.Once(() => {
		// 	isAttacking = false;
		// });
		print("Powerup action triggered");
		Remotes.Client.GetNamespace("Actions").Get("PlayerUsePowerup").SendToServer();
	}
}

function onInputEnded(input: InputObject) {
	const key = input.KeyCode.Name.lower();
	if (keyDirectionMap[key]) {
		heldKeys.delete(key);
	}
}

function onRenderStepped() {
	if (isAttacking) return;
	let moveDirection = new Vector3(0, 0, 0);
	heldKeys.forEach((key) => {
		moveDirection = moveDirection.add(keyDirectionMap[key]);
	});
	if (moveDirection.Magnitude > 0) {
		moveAndFace(moveDirection);
	}
}

speedPowerupReceived.Connect((time: number) => {
	humanoid.WalkSpeed += 10;
	task.delay(time, () => {
		humanoid.WalkSpeed = MOVE_SPEED;
	});
});

invisiblePowerupReceived.Connect((time: number) => {
	//make character transparent
});

slowDown.Connect((time: number) => {
	humanoid.WalkSpeed = MOVE_SPEED / 2;
	task.delay(time, () => {
		humanoid.WalkSpeed = MOVE_SPEED;
	});
});

// Dizzy effect it should invert the player's controls for a short time
Dizzy.Connect((time: number) => {
	isDizzy = true;
	print(`Dizzy effect started for ${time} seconds`);

	task.delay(time, () => {
		isDizzy = false;
		print("Dizzy effect ended");
	});
});

shieldReceived.Connect((time: number) => {
	// Implement shield effect, e.g., visual feedback
	print(`Shield received for ${time} seconds`);
	task.delay(time, () => {
		print("Shield effect ended");
	});
});

disableAttack.Connect((time: number) => {
	isAttackDisabled = true;
	task.delay(time, () => {
		isAttackDisabled = false;
	});
});

UserInputService.InputBegan.Connect(onInputBegan);
UserInputService.InputEnded.Connect(onInputEnded);
RunService.RenderStepped.Connect(onRenderStepped);
