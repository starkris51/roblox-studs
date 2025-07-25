import Roact from "@rbxts/roact";

interface ReadyButtonProps {
    onToggleReady: () => void;
    isReady: boolean;
}

export = (props: ReadyButtonProps) => (
    <screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
        <textbutton
            Size={new UDim2(0.22, 0, 0.11, 0)}
            Position={new UDim2(0.5, 0, 0.5, 0)}
            AnchorPoint={new Vector2(0.5, 0.5)}
            Text={props.isReady ? "Ready" : "Unready"}
            BackgroundColor3={props.isReady ? Color3.fromRGB(46, 204, 113) : Color3.fromRGB(231, 76, 60)}
            BorderSizePixel={0}
            TextColor3={Color3.fromRGB(255, 255, 255)}
            Font={Enum.Font.GothamBold}
            TextScaled={true}
            AutoButtonColor={true}
            Event={{
                MouseButton1Click: props.onToggleReady,
            }}
        >
            <uicorner CornerRadius={new UDim(0, 18)} />
            <uistroke
                Color={props.isReady ? Color3.fromRGB(39, 174, 96) : Color3.fromRGB(192, 57, 43)}
                Thickness={2}
            />
            <uigradient
                Color={new ColorSequence([
                    new ColorSequenceKeypoint(0, Color3.fromRGB(255, 255, 255)),
                    new ColorSequenceKeypoint(1, Color3.fromRGB(200, 200, 200)),
                ])}
                // Transparency={new NumberSequence([
                //     new NumberSequenceKeypoint(0, 0.2),
                //     new NumberSequenceKeypoint(1, 1),
                // ])}
                Rotation={90}
            />
            <uipadding
                PaddingTop={new UDim(0, 8)}
                PaddingBottom={new UDim(0, 8)}
                PaddingLeft={new UDim(0, 16)}
                PaddingRight={new UDim(0, 16)}
            />
        </textbutton>
    </screengui>
);