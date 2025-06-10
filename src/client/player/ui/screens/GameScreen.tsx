import Roact from "@rbxts/roact";

interface GameScreenProps {
    timeLeft: number;
}

export default function GameScreen({ timeLeft }: GameScreenProps) {
    // Format time as MM:SS
    const minutes = math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    
    return (
        <frame
            Size={UDim2.fromScale(1, 1)}
            BackgroundTransparency={1}
        >
            {timeLeft > 0 && (
                <frame
                    Position={UDim2.fromScale(0.5, 0.05)}
                    AnchorPoint={new Vector2(0.5, 0)}
                    Size={UDim2.fromOffset(120, 50)}
                    BackgroundColor3={Color3.fromRGB(0, 0, 0)}
                    BackgroundTransparency={0.5}
                >
                    <uicorner CornerRadius={new UDim(0.3, 0)} />
                    <textlabel
                        Size={UDim2.fromScale(1, 1)}
                        BackgroundTransparency={1}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        Font={Enum.Font.GothamBold}
                        TextSize={24}
                        Text={timeString}
                    />
                </frame>
            )}
        </frame>
    );
}
