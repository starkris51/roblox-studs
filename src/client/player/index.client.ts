import { Workspace, RunService, Players } from "@rbxts/services";
import ServerRemotes from "shared/remotes/server";

const player = Players.LocalPlayer;
const character = player.Character || player.CharacterAdded.Wait()[0];
const humanoid = character.WaitForChild("Humanoid") as Humanoid;
const rootPart = character.WaitForChild("HumanoidRootPart") as BasePart;

const camera = Workspace.CurrentCamera!;
camera.CameraType = Enum.CameraType.Scriptable;

ServerRemotes.Client.GetNamespace("Camera")
	.Get("CameraToMap")
	.Connect((CFrame: CFrame) => {
		if (rootPart) {
			camera.CFrame = CFrame;
		}
	});
