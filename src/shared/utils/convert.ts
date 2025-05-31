import { GridPosition } from "shared/types/grid";

export function vector3ToTilePosition(vector: Vector3, tileSize: number): GridPosition {
	return {
		x: math.round(vector.Z / tileSize),
		y: math.round(vector.X / tileSize),
	};
}

export function tilePositionToVector3(position: GridPosition, tileSize: number): Vector3 {
	return new Vector3(position.y * tileSize, 0, position.x * tileSize);
}

export function flipDirection(direction: Vector3): Vector3 {
	return new Vector3(direction.Z, 0, direction.X);
}
