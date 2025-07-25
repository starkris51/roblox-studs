import Roact from "@rbxts/roact";
import { PlayerReadyData } from "shared/types/game";

interface PlayerReadyListProps {
    players: PlayerReadyData[];
}

function PlayerReadyItem(props: { player: PlayerReadyData }) {
    const { player } = props;
    const thumbnailUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${player.userId}&width=60&height=60&format=png`;
    
    return (
        <frame
            Size={new UDim2(1, 0, 0, 60)}
            BackgroundColor3={player.isReady ? Color3.fromRGB(40, 70, 40) : Color3.fromRGB(70, 40, 40)}
            BorderSizePixel={1}
            BorderColor3={Color3.fromRGB(100, 100, 100)}
        >
            <uicorner CornerRadius={new UDim(0, 4)} />
            
            {/* Player Avatar */}
            <imagelabel
                Size={new UDim2(0, 50, 0, 50)}
                Position={new UDim2(0, 5, 0, 5)}
                BackgroundTransparency={1}
                Image={thumbnailUrl}
            >
                <uicorner CornerRadius={new UDim(0, 25)} />
            </imagelabel>
            
            {/* Player Name */}
            <textlabel
                Size={new UDim2(1, -120, 1, 0)}
                Position={new UDim2(0, 60, 0, 0)}
                BackgroundTransparency={1}
                Text={player.displayName}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                Font={Enum.Font.Gotham}
                TextSize={18}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Center}
            />
            
            {/* Ready Status */}
            <textlabel
                Size={new UDim2(0, 60, 1, 0)}
                Position={new UDim2(1, -65, 0, 0)}
                BackgroundTransparency={1}
                Text={player.isReady ? "READY" : "NOT READY"}
                TextColor3={player.isReady ? Color3.fromRGB(100, 255, 100) : Color3.fromRGB(255, 100, 100)}
                Font={Enum.Font.GothamBold}
                TextSize={12}
                TextScaled={true}
                TextXAlignment={Enum.TextXAlignment.Center}
                TextYAlignment={Enum.TextYAlignment.Center}
            />
        </frame>
    );
}

export = (props: PlayerReadyListProps) => {
    const readyCount = props.players.filter(p => p.isReady).size();
    const totalCount = props.players.size();

    return (
        <screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
            <frame
                Size={new UDim2(0.3, 0, 0.6, 0)}
                Position={new UDim2(0.05, 0, 0.2, 0)}
                BackgroundColor3={Color3.fromRGB(25, 25, 25)}
                BorderSizePixel={2}
                BorderColor3={Color3.fromRGB(60, 60, 60)}
            >
                <uicorner CornerRadius={new UDim(0, 8)} />
                
                {/* Header */}
                <textlabel
                    Size={new UDim2(1, 0, 0, 40)}
                    Position={new UDim2(0, 0, 0, 0)}
                    BackgroundColor3={Color3.fromRGB(35, 35, 35)}
                    Text={`Players in Lobby (${readyCount}/${totalCount} Ready)`}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Font={Enum.Font.GothamBold}
                    TextSize={16}
                    TextScaled={true}
                >
                    <uicorner CornerRadius={new UDim(0, 8)} />
                </textlabel>
                
                {/* Player List */}
                <scrollingframe
                    Size={new UDim2(1, -10, 1, -50)}
                    Position={new UDim2(0, 5, 0, 45)}
                    BackgroundTransparency={1}
                    ScrollBarThickness={6}
                    CanvasSize={new UDim2(0, 0, 0, totalCount * 65)}
                >
                    <uilistlayout 
                        Padding={new UDim(0, 5)} 
                        FillDirection={Enum.FillDirection.Vertical} 
                        SortOrder={Enum.SortOrder.LayoutOrder}
                    />
                    
                    {props.players.map((player, index) => (
                        <PlayerReadyItem 
                            Key={player.userId} 
                            player={player}
                        />
                    ))}
                </scrollingframe>
            </frame>
        </screengui>
    );
};