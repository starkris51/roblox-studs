import { Workspace } from "@rbxts/services";
import { GridPosition, TilePartConfig } from "shared/types/grid";

export function createTilePart(config: TilePartConfig, position: GridPosition): Part {
    const part = new Instance("Part");
    part.Size = new Vector3(config.tileSize, config.tileSize, config.tileSize);

    const isEven = (position.x + position.y) % 2 === 0;
    const colorA = config.tileColor || Color3.fromRGB(112, 77, 77);
    const colorB = Color3.fromRGB(200, 200, 200);
    part.Color = isEven ? colorA : colorB;

    part.Anchored = true;
    part.CanCollide = true;
    part.Material = Enum.Material.SmoothPlastic;
    part.Parent = Workspace;
    part.Position = new Vector3(position.y * config.tileSize, 0, position.x * config.tileSize);
    return part;
}