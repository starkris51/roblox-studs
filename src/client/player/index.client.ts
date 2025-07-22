import { RunService, Workspace } from "@rbxts/services";
import ServerRemotes from "shared/remotes/server";

const camera = Workspace.CurrentCamera!;
camera.CameraType = Enum.CameraType.Scriptable;

let lockedCameraCFrame: CFrame | undefined = undefined;

ServerRemotes.Client.GetNamespace("Camera")
	.Get("CameraToMap")
	.Connect((CFrame: CFrame) => {
		lockedCameraCFrame = CFrame;
		camera.CameraType = Enum.CameraType.Scriptable;
		camera.CFrame = CFrame;
		camera.FieldOfView = 40; // Set a default FOV
	});

RunService.RenderStepped.Connect(() => {
	if (lockedCameraCFrame) {
		camera.CameraType = Enum.CameraType.Scriptable;
		camera.CFrame = lockedCameraCFrame;
	}
});
