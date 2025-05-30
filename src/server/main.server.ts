import { Grid } from "shared/classes/grid";
import Remotes from "shared/remotes/player";

const grid = new Grid(10, 10);

grid.render({
    tileSize: 5,
    tileColor: new Color3(1, 0, 0), // Red color
});

Remotes.Server.GetNamespace('Actions').Get('PlayerAttack').Connect((player, position, direction) => {
    print(`Player ${player.Name} attacked at position ${position} in direction ${direction}`);
});