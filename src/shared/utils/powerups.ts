import { Grid } from "shared/classes/grid";
import { flipDirection, vector3ToTilePosition } from "./convert";
import { GridPosition } from "shared/types/grid";

export function fourLinePowerup(grid: Grid, position: Vector3, color: Color3) {
	// Do line attack in four directions in diagonal lines

	const gridPosition = vector3ToTilePosition(position, grid.getConfig()?.tileSize || 5);

	const diagonalDirections = [
		new Vector3(1, 0, 1), // Down-Right
		new Vector3(-1, 0, 1), // Down-Left
		new Vector3(1, 0, -1), // Up-Right
		new Vector3(-1, 0, -1), // Up-Left
	];

	for (const direction of diagonalDirections) {
		grid.lineAttack(gridPosition, direction, 0, color);
	}
}

export function shotgunPowerup(grid: Grid, position: Vector3, direction: Vector3, color: Color3): boolean {
	// Do a shotgun attack in a 3x3 area around the position
	const gridPosition = vector3ToTilePosition(position, grid.getConfig()?.tileSize || 5);

	// check if direction is diagonal

	if (math.abs(direction.X) > 0 && math.abs(direction.Z) > 0) {
		warn("Shotgun powerup does not support diagonal directions.");
		return false;
	}

	// Do 3 line attack from the player's direction
	for (let i = 0; i < 3; i++) {
		const shotgunPosition = vector3ToTilePosition(
			position.add(direction.mul(i * 5)),
			grid.getConfig()?.tileSize || 5,
		);

		grid.lineAttack(shotgunPosition, direction, 0, color);
	}

	return true;
}
