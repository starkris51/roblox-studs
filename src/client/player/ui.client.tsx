import Roact from "@rbxts/roact";
import MapVote from "shared/components/MapVote";
import ServerRemotes from "shared/remotes/server";
import PlayerRemotes from "shared/remotes/player";
import { Players } from "@rbxts/services";
import { MapType } from "shared/enums/grid";
import Timer = require("shared/components/Timer");

let mapVoteHandle: Roact.Tree | undefined;

const onVote = (mapName: MapType) => {
    PlayerRemotes.Client.GetNamespace("Voting").Get("VoteMap").SendToServer(mapName);
    if (mapVoteHandle) {
        Roact.unmount(mapVoteHandle);
        mapVoteHandle = undefined;
    }
};

ServerRemotes.Client.GetNamespace("Game")
    .Get("VoteMapSession")
    .Connect((maps: MapType[]) => {
        if (!mapVoteHandle) {
            mapVoteHandle = Roact.mount(<MapVote maps={maps} onVote={onVote} />, Players.LocalPlayer.WaitForChild("PlayerGui"));
        }
    });


ServerRemotes.Client.GetNamespace("Game")
    .Get("EndVoteMapSession")
    .Connect(() => {
        if (mapVoteHandle) {
            Roact.unmount(mapVoteHandle);
            mapVoteHandle = undefined;
        }
    });

let timerHandle: Roact.Tree | undefined;
let currentTime = 0;

const mountTimer = (timeLeft: number) => {
    if (timerHandle) Roact.unmount(timerHandle);
    timerHandle = Roact.mount(
        <Timer timeLeft={timeLeft} />,
        Players.LocalPlayer.WaitForChild("PlayerGui"),
    );
};

ServerRemotes.Client.GetNamespace("Timer")
    .Get("Start")
    .Connect((timeLeft: number) => {
        currentTime = timeLeft;
        mountTimer(currentTime);
    });

ServerRemotes.Client.GetNamespace("Timer")
    .Get("Tick")
    .Connect((timeLeft: number) => {
        currentTime = timeLeft;
        mountTimer(currentTime);
    });

ServerRemotes.Client.GetNamespace("Timer")
    .Get("End")
    .Connect(() => {
        if (timerHandle) {
            Roact.unmount(timerHandle);
            timerHandle = undefined;
        }
    });