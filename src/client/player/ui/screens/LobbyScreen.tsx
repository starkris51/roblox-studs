import Roact from "@rbxts/roact";

interface LobbyScreenProps {
    isReady: boolean;
    onToggleReady: () => void;
}

export default function LobbyScreen({ isReady, onToggleReady }: LobbyScreenProps) {
    return (
        <frame
            Size={UDim2.fromScale(1, 1)}
            BackgroundTransparency={1}
        >
            <textbutton
                Position={UDim2.fromScale(0.5, 0.5)}
                AnchorPoint={new Vector2(0.5, 0.5)}
                Size={UDim2.fromOffset(200, 50)}
                BackgroundColor3={isReady ? Color3.fromRGB(0, 200, 0) : Color3.fromRGB(200, 0, 0)}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                Font={Enum.Font.GothamBold}
                TextSize={18}
                Text={isReady ? "READY" : "NOT READY"}
                Event={{
                    MouseButton1Click: onToggleReady,
                }}
            >
                <uicorner CornerRadius={new UDim(0.3, 0)} />
            </textbutton>
            
            <textlabel
                Position={UDim2.fromScale(0.5, 0.4)}
                AnchorPoint={new Vector2(0.5, 0.5)}
                Size={UDim2.fromOffset(400, 50)}
                BackgroundTransparency={1}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                Font={Enum.Font.GothamSemibold}
                TextSize={24}
                Text="Waiting for players to ready up..."
            />
        </frame>
    );
}
