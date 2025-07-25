import Roact from "@rbxts/roact";
import { PlayerHealth } from "shared/types/game";

interface PlayerHealthListProps {
    players: PlayerHealth[];
}

function PlayerHealthItem(props: { player: PlayerHealth }) {
    const { player } = props;
    const thumbnailUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${player.userId}&width=50&height=50&format=png`;
    
    // Create health indicator dots
    const maxHealth = 5; // Assuming max health is 5
    const healthDots = [];
    
    for (let i = 0; i < maxHealth; i++) {
        const isActive = i < player.health;
        healthDots.push(
            <frame
                Size={new UDim2(0, 12, 0, 12)}
                Position={new UDim2(0, i * 16, 0.5, -6)}
                BackgroundColor3={isActive ? Color3.fromRGB(255, 80, 80) : Color3.fromRGB(60, 60, 60)}
                BorderSizePixel={1}
                BorderColor3={isActive ? Color3.fromRGB(255, 120, 120) : Color3.fromRGB(40, 40, 40)}
            >
                <uicorner CornerRadius={new UDim(0, 6)} />
            </frame>
        );
    }

    const healthColor = player.health > 3 ? Color3.fromRGB(100, 255, 100) :
                       player.health > 1 ? Color3.fromRGB(255, 200, 100) :
                       Color3.fromRGB(255, 100, 100);

    return (
        <frame
            Size={new UDim2(1, 0, 0, 55)}
            BackgroundColor3={Color3.fromRGB(30, 30, 35)}
            BorderSizePixel={1}
            BorderColor3={Color3.fromRGB(80, 80, 90)}
        >
            <uicorner CornerRadius={new UDim(0, 4)} />
            
            {/* Player Avatar */}
            <imagelabel
                Size={new UDim2(0, 45, 0, 45)}
                Position={new UDim2(0, 5, 0, 5)}
                BackgroundTransparency={1}
                Image={thumbnailUrl}
            >
                <uicorner CornerRadius={new UDim(0, 22)} />
            </imagelabel>
            
            {/* Player Name */}
            <textlabel
                Size={new UDim2(1, -140, 0.6, 0)}
                Position={new UDim2(0, 55, 0, 0)}
                BackgroundTransparency={1}
                Text={player.displayName}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                Font={Enum.Font.Gotham}
                TextSize={14}
                TextXAlignment={Enum.TextXAlignment.Left}
                TextYAlignment={Enum.TextYAlignment.Center}
            />
            
            {/* Health Number */}
            <textlabel
                Size={new UDim2(0, 30, 0.6, 0)}
                Position={new UDim2(1, -35, 0, 0)}
                BackgroundTransparency={1}
                Text={tostring(player.health)}
                TextColor3={healthColor}
                Font={Enum.Font.GothamBold}
                TextSize={20}
                TextScaled={true}
                TextXAlignment={Enum.TextXAlignment.Center}
                TextYAlignment={Enum.TextYAlignment.Center}
            />
            
            {/* Health Dots Container */}
            <frame
                Size={new UDim2(0, maxHealth * 16 - 4, 0.4, 0)}
                Position={new UDim2(0, 55, 0.6, 0)}
                BackgroundTransparency={1}
            >
                {healthDots}
            </frame>
        </frame>
    );
}

export = (props: PlayerHealthListProps) => {
    const alivePlayers = props.players.filter(p => p.health > 0);
    const deadPlayers = props.players.filter(p => p.health <= 0);
    const sortedPlayers = [
        ...alivePlayers.sort((a, b) => b.health > a.health),
        ...deadPlayers
    ];

    return (
        <screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
            <frame
                Size={new UDim2(0.2, 0, 0.6, 0)}
                Position={new UDim2(0.05, 0, 0.2, 0)}
                BackgroundColor3={Color3.fromRGB(20, 20, 25)}
                BorderSizePixel={2}
                BorderColor3={Color3.fromRGB(80, 80, 90)}
            >
                <uicorner CornerRadius={new UDim(0, 8)} />
                
                {/* Header */}
                <textlabel
                    Size={new UDim2(1, 0, 0, 35)}
                    Position={new UDim2(0, 0, 0, 0)}
                    BackgroundColor3={Color3.fromRGB(35, 35, 40)}
                    Text="Player Health"
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Font={Enum.Font.GothamBold}
                    TextSize={14}
                    TextScaled={true}
                >
                    <uicorner CornerRadius={new UDim(0, 8)} />
                </textlabel>
                
                {/* Health List */}
                <scrollingframe
                    Size={new UDim2(1, -8, 1, -40)}
                    Position={new UDim2(0, 4, 0, 38)}
                    BackgroundTransparency={1}
                    ScrollBarThickness={4}
                    CanvasSize={new UDim2(0, 0, 0, sortedPlayers.size() * 60)}
                >
                    <uilistlayout 
                        Padding={new UDim(0, 3)} 
                        FillDirection={Enum.FillDirection.Vertical} 
                        SortOrder={Enum.SortOrder.LayoutOrder}
                    />
                    
                    {sortedPlayers.map((player, _) => (
                        <PlayerHealthItem 
                            Key={player.userId} 
                            player={player}
                        />
                    ))}
                </scrollingframe>
            </frame>
        </screengui>
    );
};