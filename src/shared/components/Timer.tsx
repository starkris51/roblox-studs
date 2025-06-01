import Roact from "@rbxts/roact";

interface TimerProps {
    timeLeft: number;
}

export = (props: TimerProps) => {
    return (
        <screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
            <frame
                Size={new UDim2(0.2, 0, 0.1, 0)}
                Position={new UDim2(0, 0, 0.45, 0)}
                BackgroundColor3={Color3.fromRGB(30, 30, 30)}
                BorderSizePixel={0}
            >
                <textlabel
                    Size={new UDim2(1, 0, 1, 0)}
                    BackgroundTransparency={1}
                    Text={`Time Left: ${props.timeLeft}s`}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Font={Enum.Font.GothamBold}
                    TextSize={24}
                    TextScaled={true}
                />
            </frame>
        </screengui>
    );
}