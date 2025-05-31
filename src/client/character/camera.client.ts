import { Workspace, RunService, Players } from "@rbxts/services";

const player = Players.LocalPlayer;
const character = player.Character || player.CharacterAdded.Wait()[0];
const humanoid = character.WaitForChild("Humanoid") as Humanoid;
const rootPart = character.WaitForChild("HumanoidRootPart") as BasePart;

const camera = Workspace.CurrentCamera!;
const CAMERA_OFFSET = new Vector3(0, 10, 20);

RunService.RenderStepped.Connect(() => {
	if (rootPart) {
		const lookAt = rootPart.Position.add(new Vector3(0, 0, -1));
		camera.CFrame = CFrame.lookAt(rootPart.Position.add(CAMERA_OFFSET), lookAt);
	}
});
