import { TweenService, Workspace } from "@rbxts/services";
import { Tile, TilePartConfig } from "shared/types/grid";

export function createTilePart(config: TilePartConfig, tile: Tile): Part {
	const part = new Instance("Part");
	part.Size = new Vector3(config.tileSize, config.tileSize, config.tileSize);

	const isEven = (tile.position.x + tile.position.y) % 2 === 0;
	const colorA = config.tileColor || Color3.fromRGB(112, 77, 77);
	const colorB = Color3.fromRGB(200, 200, 200);
	part.Color = isEven ? colorA : colorB;
	tile.color = part.Color;

	part.Anchored = true;
	part.CanCollide = true;
	part.Material = Enum.Material.SmoothPlastic;
	part.Parent = Workspace;
	part.Position = new Vector3(tile.position.y * config.tileSize, 0, tile.position.x * config.tileSize);
	return part;
}

export function changeTileColor(part: Part | undefined, color: Color3): void {
	if (!part || !part.IsA("Part")) {
		throw error("Invalid part provided to changeTileColor");
	}

	part.Color = color;
}

export function makeTileFall(part: Part | undefined): Promise<void> {
	return new Promise((resolve, reject) => {
		if (!part || !part.IsA("Part")) {
			reject("Invalid part provided to makeTileFall");
			return;
		}
		const tweenInfo = new TweenInfo(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
		const goal = { Position: part.Position.add(new Vector3(0, -50, 0)) };
		const tween = TweenService.Create(part, tweenInfo, goal);
		tween.Completed.Connect(() => resolve());
		tween.Play();
	});
}

export function makeTileRise(part: Part | undefined): Promise<void> {
	return new Promise((resolve, reject) => {
		if (!part || !part.IsA("Part")) {
			reject("Invalid part provided to makeTileRise");
			return;
		}
		const tweenInfo = new TweenInfo(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out);
		const goal = { Position: part.Position.add(new Vector3(0, 50, 0)) };
		const tween = TweenService.Create(part, tweenInfo, goal);
		tween.Completed.Connect(() => resolve());
		tween.Play();
	});
}
