import Roact from "@rbxts/roact";
import { MapType } from "shared/enums/grid";

interface MapVoteProps {
    maps: MapType[];
    onVote: (mapName: MapType) => void;
}

function mapTypeToString(map: MapType): string {
    switch (map) {
        case MapType.Normal:
            return "Normal Map";
        case MapType.Large:
            return "Large Map";
        case MapType.Randomized:
            return "Randomized Map";
        default:
            return "Unknown Map";
    }
}


export = (props: MapVoteProps) => {
    return (
        <screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
            <frame
                Size={new UDim2(0.4, 0, 0.3, 0)}
                Position={new UDim2(0.3, 0, 0.35, 0)}
                BackgroundColor3={Color3.fromRGB(30, 30, 30)}
                BorderSizePixel={0}
            >
                <uilistlayout Padding={new UDim(0, 10)} FillDirection={Enum.FillDirection.Vertical} />
                <textlabel
                    Size={new UDim2(1, 0, 0, 40)}
                    BackgroundTransparency={1}
                    Text="Vote for a Map!"
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Font={Enum.Font.GothamBold}
                    TextSize={28}
                />
                {props.maps.map((map) => (
                    <textbutton
                        Size={new UDim2(1, 0, 0, 36)}
                        BackgroundColor3={Color3.fromRGB(60, 60, 60)}
                        Text={mapTypeToString(map)}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        Font={Enum.Font.Gotham}
                        TextSize={22}
                        Event={{
                            MouseButton1Click: () => props.onVote(map),
                        }}
                    />
                ))}
            </frame>
        </screengui>
    );
};