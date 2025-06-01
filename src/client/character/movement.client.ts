import { Players, UserInputService, RunService } from "@rbxts/services";
import PlayerAnimations from "shared/assets/animations/player";
import { AnimationController } from "shared/classes/animation";
import Remotes from "shared/remotes/player";

const player = Players.LocalPlayer;
const character = player.Character || player.CharacterAdded.Wait()[0];
const humanoid = character.WaitForChild("Humanoid") as Humanoid;
const rootPart = character.WaitForChild("HumanoidRootPart") as BasePart;
const animator = humanoid.WaitForChild("Animator") as Animator;
const animationController = new AnimationController(animator);

const MOVE_SPEED = 16;

humanoid.JumpPower = 0;
humanoid.JumpHeight = 0;
humanoid.AutoJumpEnabled = false;
humanoid.AutoRotate = false;
humanoid.WalkSpeed = MOVE_SPEED;

let isAttacking = false;

const actions = Remotes.Client.GetNamespace("Actions");
const playerAttack = actions.Get("PlayerAttack");

const keyDirectionMap: Record<string, Vector3> = {
	w: new Vector3(0, 0, -1),
	a: new Vector3(-1, 0, 0),
	s: new Vector3(0, 0, 1),
	d: new Vector3(1, 0, 0),
};

const heldKeys = new Set<string>();
let currentDirection = new Vector3(0, 0, -1);

function moveAndFace(direction: Vector3) {
	currentDirection = direction;
	rootPart.CFrame = CFrame.lookAt(rootPart.Position, rootPart.Position.add(currentDirection));
}

function onInputBegan(input: InputObject, processed: boolean) {
	if (processed) return;
	const key = input.KeyCode.Name.lower();
	if (keyDirectionMap[key]) {
		heldKeys.add(key);
	}
	if (input.KeyCode === Enum.KeyCode.Space && !isAttacking) {
		isAttacking = true;
		humanoid.WalkSpeed = 0; // Stop movement during attack
		const attackTrack = animationController.play("Attack");
		attackTrack.Stopped.Once(() => {
			isAttacking = false;
			humanoid.WalkSpeed = MOVE_SPEED;
		});
		wait(0.55); // Wait for the kick animation to finish
		playerAttack.SendToServer(rootPart.Position, new Vector3(currentDirection.X, 0, currentDirection.Z));
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

UserInputService.InputBegan.Connect(onInputBegan);
UserInputService.InputEnded.Connect(onInputEnded);
RunService.RenderStepped.Connect(onRenderStepped);
