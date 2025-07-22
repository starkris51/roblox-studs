export const playerColors: Record<number, Color3> = {
	1: new Color3(1, 0.18, 0),
	2: new Color3(0.07, 0.12, 0.89),
	3: new Color3(0.459, 1, 0.2),
	4: new Color3(0.9, 0.9, 0.1),
	5: new Color3(0.9, 0.1, 0.9),
	6: new Color3(0.1, 0.9, 0.9),
	7: new Color3(0.9, 0.5, 0.1),
	8: new Color3(0.5, 0, 1),
	9: new Color3(1, 1, 1),
	10: new Color3(0.5, 0.5, 0.5),
	11: new Color3(0.73, 0.32, 0),
	12: new Color3(0.2, 0.8, 0.4),
};

export const mapSizesBasedOnPlayerCount: Record<number, { width: number; height: number }> = {
	2: { width: 6, height: 6 },
	4: { width: 8, height: 8 },
	8: { width: 12, height: 12 },
	12: { width: 16, height: 16 },
};

export function getMapSizeForPlayerCount(playerCount: number): { width: number; height: number } {
	if (playerCount <= 2) {
		return mapSizesBasedOnPlayerCount[2];
	} else if (playerCount <= 4) {
		return mapSizesBasedOnPlayerCount[4];
	} else if (playerCount <= 8) {
		return mapSizesBasedOnPlayerCount[8];
	} else {
		return mapSizesBasedOnPlayerCount[12];
	}
}
