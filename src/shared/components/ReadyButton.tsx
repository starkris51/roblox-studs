import Roact from "@rbxts/roact";

interface ReadyButtonProps {
    onToggleReady: () => void;
    isReady: boolean;
}

export = (props: ReadyButtonProps) => (
    <screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
        <textbutton
            Size={new UDim2(0.2, 0, 0.1, 0)}
            Position={new UDim2(0.5, 0, 0.5, 0)}
            AnchorPoint={new Vector2(0.5, 0.5)}
            Text={props.isReady ? "Ready" : "Unready"}
            BackgroundColor3={props.isReady ? Color3.fromRGB(0, 200, 0) : Color3.fromRGB(200, 0, 0)}
            Event={{
                MouseButton1Click: props.onToggleReady,
            }}
        />
    </screengui>
);