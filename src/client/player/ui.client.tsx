import Roact from "@rbxts/roact";
import MapVote from "shared/components/MapVote";
import ServerRemotes from "shared/remotes/server";
import PlayerRemotes from "shared/remotes/player";
import { Players } from "@rbxts/services";
import { MapType } from "shared/enums/grid";
import { Powerups } from "shared/enums/game";
import Timer = require("shared/components/Timer");
import ReadyButton from "shared/components/ReadyButton";
import Powerup from "shared/components/Powerup";
import PlayerReadyList from "shared/components/PlayerReadyList";
import { GameResultEntry, PlayerHealth, PlayerReadyData } from "shared/types/game";
import PlayerHealthList = require("shared/components/PlayerHealthList");
import ResultsScreen from "shared/components/ResultsScreen";

let mapVoteHandle: Roact.Tree | undefined;

const mountPlayerReadyList = () => {
    if (playerReadyListHandle) Roact.unmount(playerReadyListHandle);
    playerReadyListHandle = Roact.mount(
        <PlayerReadyList players={playerList} />,
        Players.LocalPlayer.WaitForChild("PlayerGui"),
        "PlayerReadyList"
    );
};

const unmountPlayerReadyList = () => {
    if (playerReadyListHandle) {
        Roact.unmount(playerReadyListHandle);
        playerReadyListHandle = undefined;
    }
};

ServerRemotes.Client.GetNamespace("UI")
    .Get("PlayerReadyUpdate")
    .Connect((newPlayerList: Array<PlayerReadyData>) => {
        playerList = newPlayerList;
        if (playerReadyListHandle) {
            mountPlayerReadyList();
        }
    });

let playerHealthHandle: Roact.Tree | undefined;
let playerHealthList: Array<PlayerHealth> = [];

const mountPlayerHealthList = () => {
    if (playerHealthHandle) Roact.unmount(playerHealthHandle);
    playerHealthHandle = Roact.mount(
        <PlayerHealthList players={playerHealthList} />,
        Players.LocalPlayer.WaitForChild("PlayerGui"),
        "PlayerHealthList"
    );
};

const unmountPlayerHealthList = () => {
    if (playerHealthHandle) {
        Roact.unmount(playerHealthHandle);
        playerHealthHandle = undefined;
    }
};

ServerRemotes.Client.GetNamespace("UI")
    .Get("PlayerHealthUpdate")
    .Connect((playerHealth: PlayerHealth[]) => {
        playerHealthList = playerHealth;
        print(`Received player health update: ${playerHealthList}`);
        print(playerHealthHandle);
        if (playerHealthHandle) {
            mountPlayerHealthList();
        }
    });

// Results Screen functionality
let resultsHandle: Roact.Tree | undefined;

const mountResultsScreen = (results: GameResultEntry[]) => {
    if (resultsHandle) Roact.unmount(resultsHandle);
    resultsHandle = Roact.mount(
        <ResultsScreen 
            results={results} 
            onContinue={() => {
                unmountResultsScreen();
            }}
        />,
        Players.LocalPlayer.WaitForChild("PlayerGui"),
        "ResultsScreen"
    );
};

const unmountResultsScreen = () => {
    if (resultsHandle) {
        Roact.unmount(resultsHandle);
        resultsHandle = undefined;
    }
};

ServerRemotes.Client.GetNamespace("UI")
    .Get("ShowResults")
    .Connect((results: GameResultEntry[]) => {
        mountResultsScreen(results);
    });


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
        unmountPlayerReadyList();
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

// Powerup display functionality
let powerupHandle: Roact.Tree | undefined;

const mountPowerup = (powerupType: Powerups) => {
    if (powerupHandle) Roact.unmount(powerupHandle);
    powerupHandle = Roact.mount(
        <Powerup powerupType={powerupType} />,
        Players.LocalPlayer.WaitForChild("PlayerGui"),
        "PowerupDisplay"
    );
};

const unmountPowerup = () => {
    if (powerupHandle) {
        Roact.unmount(powerupHandle);
        powerupHandle = undefined;
    }
};

// Listen for powerup received from server
PlayerRemotes.Client.GetNamespace("Actions")
    .Get("PlayerGotPowerup")
    .Connect((powerupType: Powerups) => {
        mountPowerup(powerupType);
    });

// Listen for powerup used to remove display
PlayerRemotes.Client.GetNamespace("Actions")
    .Get("PlayerUsedPowerup")
    .Connect(() => {
        unmountPowerup();
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
    .Connect(() => {
        mountReadyButton(); 
        mountPlayerReadyList(); 
        unmountResultsScreen(); // Hide results when returning to lobby
    });

ServerRemotes.Client.GetNamespace("Game")
    .Get("Start")
    .Connect(() => {
        unmountPowerup();
        unmountPlayerReadyList();
        mountPlayerHealthList();
        unmountResultsScreen();
        print("it goes here bruh")
    });

ServerRemotes.Client.GetNamespace("Game")
    .Get("End")
    .Connect((results: GameResultEntry[]) => {
        unmountPlayerHealthList();
        mountResultsScreen(results);
    });

let playerReadyListHandle: Roact.Tree | undefined;
let playerList: Array<PlayerReadyData> = [];

