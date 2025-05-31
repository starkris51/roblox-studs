import { PlayerDirection } from "shared/enums/player";
import { GridPosition } from "shared/types/grid";

function vectorEquals(a: Vector3, b: Vector3): boolean {
	return a.X === b.X && a.Y === b.Y && a.Z === b.Z;
}

export function directionToVector3(direction: PlayerDirection): Vector3 {
	switch (direction) {
		case PlayerDirection.Up:
			return new Vector3(0, 0, -1);
		case PlayerDirection.Down:
			return new Vector3(0, 0, 1);
		case PlayerDirection.Left:
			return new Vector3(-1, 0, 0);
		case PlayerDirection.Right:
			return new Vector3(1, 0, 0);
		case PlayerDirection.UpLeft:
			return new Vector3(-1, 0, -1).Unit;
		case PlayerDirection.UpRight:
			return new Vector3(1, 0, -1).Unit;
		case PlayerDirection.DownLeft:
			return new Vector3(-1, 0, 1).Unit;
		case PlayerDirection.DownRight:
			return new Vector3(1, 0, 1).Unit;
		default:
			return new Vector3(0, 0, 0);
	}
}

export function vector3ToDirection(vector: Vector3): PlayerDirection {
	const normalized = vector.Unit;

	if (vectorEquals(normalized, new Vector3(0, 0, -1))) {
		return PlayerDirection.Up;
	} else if (vectorEquals(normalized, new Vector3(0, 0, 1))) {
		return PlayerDirection.Down;
	} else if (vectorEquals(normalized, new Vector3(-1, 0, 0))) {
		return PlayerDirection.Left;
	} else if (vectorEquals(normalized, new Vector3(1, 0, 0))) {
		return PlayerDirection.Right;
	} else if (vectorEquals(normalized, new Vector3(-1, 0, -1))) {
		return PlayerDirection.UpLeft;
	} else if (vectorEquals(normalized, new Vector3(1, 0, -1))) {
		return PlayerDirection.UpRight;
	} else if (vectorEquals(normalized, new Vector3(-1, 0, 1))) {
		return PlayerDirection.DownLeft;
	} else if (vectorEquals(normalized, new Vector3(1, 0, 1))) {
		return PlayerDirection.DownRight;
	}
	return PlayerDirection.None;
}

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
