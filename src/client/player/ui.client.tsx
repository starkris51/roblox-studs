import Roact from "@rbxts/roact";
import { Players } from "@rbxts/services";
import ServerRemotes from "shared/remotes/server";
import PlayerRemotes from "shared/remotes/player";
import { MapType } from "shared/enums/grid";

import LobbyScreen from "./ui/screens/LobbyScreen";
import VotingScreen from "./ui/screens/VotingScreen";
import GameScreen from "./ui/screens/GameScreen";

type ScreenType = "none" | "lobby" | "voting" | "game";

// UI state interface
interface UIState {
    currentScreen: ScreenType;
    isPlayerReady: boolean;
    maps: MapType[];
    timeLeft: number;
}

const initialState: UIState = {
    currentScreen: "none",
    isPlayerReady: false,
    maps: [],
    timeLeft: 0,
};

class App extends Roact.Component<{}, UIState> {
    constructor(props: {}) {
        super(props);
        this.state = initialState;
        
        this.connectRemotes();
    }
    
    connectRemotes() {
        // Game state events
        ServerRemotes.Client.GetNamespace("Game").Get("Lobby").Connect(() => {
            this.setState({
                currentScreen: "lobby"
            });
        });
        
        ServerRemotes.Client.GetNamespace("Game").Get("VoteMapSession").Connect((maps: MapType[]) => {
            if (this.state.isPlayerReady) {
                this.setState({
                    currentScreen: "voting",
                    maps: maps
                });
            }
        });
        
        ServerRemotes.Client.GetNamespace("Game").Get("EndVoteMapSession").Connect(() => {
            this.setState({
                currentScreen: "game"
            });
        });
        
        // Timer events
        ServerRemotes.Client.GetNamespace("Timer").Get("Start").Connect((timeLeft: number) => {
            this.setState({ timeLeft });
        });
        
        ServerRemotes.Client.GetNamespace("Timer").Get("Tick").Connect((timeLeft: number) => {
            this.setState({ timeLeft });
        });
        
        ServerRemotes.Client.GetNamespace("Timer").Get("End").Connect(() => {
            this.setState({ timeLeft: 0 });
        });
    }
    
    toggleReady = async () => {
        const isReady = await PlayerRemotes.Client.GetNamespace("UI").Get("PlayerToggleReady").CallServerAsync();
        this.setState({ isPlayerReady: isReady });
        print(`Player is now ${isReady ? "ready" : "not ready"}`);
    }
    
    handleMapVote = (mapName: MapType) => {
        PlayerRemotes.Client.GetNamespace("Voting").Get("VoteMap").SendToServer(mapName);
        this.setState({ currentScreen: "game" });
    }
    
    render() {
        const { currentScreen, isPlayerReady, maps, timeLeft } = this.state;
        
        return (
            <screengui ResetOnSpawn={false} IgnoreGuiInset={true} ZIndexBehavior={Enum.ZIndexBehavior.Sibling}>
                {currentScreen === "lobby" && (
                    <LobbyScreen 
                        isReady={isPlayerReady} 
                        onToggleReady={this.toggleReady} 
                    />
                )}
                
                {currentScreen === "voting" && (
                    <VotingScreen 
                        maps={maps} 
                        onVote={this.handleMapVote} 
                    />
                )}
                
                {currentScreen === "game" && (
                    <GameScreen 
                        timeLeft={timeLeft} 
                    />
                )}
            </screengui>
        );
    }
}

const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui");
const app = Roact.mount(<App />, playerGui, "MainUI");