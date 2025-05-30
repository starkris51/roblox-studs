import { Grid } from "shared/classes/grid";

const grid = new Grid(10, 10);

grid.render({
    tileSize: 5,
    tileColor: new Color3(1, 0, 0), // Red color
});