import { Players, UserInputService, RunService } from "@rbxts/services";

const player = Players.LocalPlayer;
const character = player.Character || player.CharacterAdded.Wait()[0];
const humanoid = character.WaitForChild("Humanoid") as Humanoid;
const rootPart = character.WaitForChild("HumanoidRootPart") as BasePart;

const MOVE_SPEED = 16;

humanoid.JumpPower = 0;
humanoid.JumpHeight = 0;
humanoid.AutoJumpEnabled = false;
humanoid.AutoRotate = false;

const keyDirectionMap: Record<string, Vector3> = {
    w: new Vector3(0, 0, -1),
    a: new Vector3(-1, 0, 0),
    s: new Vector3(0, 0, 1),
    d: new Vector3(1, 0, 0),
};

const heldKeys = new Set<string>();

function moveAndFace(direction: Vector3) {
    rootPart.CFrame = CFrame.lookAt(rootPart.Position, rootPart.Position.add(direction));
}

function onInputBegan(input: InputObject, processed: boolean) {
    if (processed) return;
    const key = input.KeyCode.Name.lower();
    if (keyDirectionMap[key]) {
        heldKeys.add(key);
    }

}

function onInputEnded(input: InputObject) {
    const key = input.KeyCode.Name.lower();
    if (keyDirectionMap[key]) {
        heldKeys.delete(key);
    }
}

function onRenderStepped() {
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