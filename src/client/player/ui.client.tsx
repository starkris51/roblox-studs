import Roact from "@rbxts/roact";
import MapVote from "shared/components/MapVote";
import ServerRemotes from "shared/remotes/server";
import PlayerRemotes from "shared/remotes/player";
import { Players } from "@rbxts/services";
import { MapType } from "shared/enums/grid";
import Timer = require("shared/components/Timer");
import ReadyButton from "shared/components/ReadyButton";

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
        if (!mapVoteHandle && isReady) {
            mapVoteHandle = Roact.mount(<MapVote maps={maps} onVote={onVote} />, Players.LocalPlayer.WaitForChild("PlayerGui"));
        }
        unmountReadyButton();
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

let readyButtonHandle: Roact.Tree | undefined;
let isReady = false;

function createReadyButtonElement() {
    return (
        <ReadyButton
            onToggleReady={async () => {
                isReady = await PlayerRemotes.Client.GetNamespace("UI").Get("PlayerToggleReady").CallServerAsync();
                print(`Player is now ${isReady ? "ready" : "not ready"}`);
                if (readyButtonHandle) {
                    Roact.update(readyButtonHandle, createReadyButtonElement());
                }
            }}
            isReady={isReady}
        />
    );
}

const mountReadyButton = () => {
    if (!readyButtonHandle) {
        readyButtonHandle = Roact.mount(
            createReadyButtonElement(),
            Players.LocalPlayer.WaitForChild("PlayerGui"),
            "ReadyButton"
        );
    }
};

const unmountReadyButton = () => {
    if (readyButtonHandle) {
        Roact.unmount(readyButtonHandle);
        readyButtonHandle = undefined;
    }
};
ServerRemotes.Client.GetNamespace("Game")
    .Get("Lobby")
    .Connect(mountReadyButton);