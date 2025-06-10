import Roact from "@rbxts/roact";
import { MapType } from "shared/enums/grid";

interface VotingScreenProps {
    maps: MapType[];
    onVote: (mapName: MapType) => void;
}

export default function VotingScreen({ maps, onVote }: VotingScreenProps) {
    return (
        <frame
            Size={UDim2.fromScale(1, 1)}
            BackgroundColor3={Color3.fromRGB(0, 0, 0)}
            BackgroundTransparency={0.5}
        >
            <textlabel
                Position={UDim2.fromScale(0.5, 0.1)}
                AnchorPoint={new Vector2(0.5, 0)}
                Size={UDim2.fromOffset(400, 50)}
                BackgroundTransparency={1}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                Font={Enum.Font.GothamBold}
                TextSize={28}
                Text="Choose a Map"
            />
            
            <frame
                Position={UDim2.fromScale(0.5, 0.5)}
                AnchorPoint={new Vector2(0.5, 0.5)}
                Size={UDim2.fromScale(0.8, 0.6)}
                BackgroundTransparency={1}
            >
                <uilistlayout
                    FillDirection={Enum.FillDirection.Horizontal}
                    HorizontalAlignment={Enum.HorizontalAlignment.Center}
                    VerticalAlignment={Enum.VerticalAlignment.Center}
                    SortOrder={Enum.SortOrder.LayoutOrder}
                    Padding={new UDim(0.05, 0)}
                />
                
                {maps.map((mapName, index) => (
                    <textbutton
                        Key={mapName}
                        LayoutOrder={index}
                        Size={UDim2.fromScale(0.28, 0.8)}
                        BackgroundColor3={Color3.fromRGB(40, 40, 60)}
                        TextColor3={Color3.fromRGB(255, 255, 255)}
                        Font={Enum.Font.GothamSemibold}
                        TextSize={22}
                        Text={mapName as unknown as string}
                        Event={{
                            MouseButton1Click: () => onVote(mapName),
                        }}
                    >
                        <uicorner CornerRadius={new UDim(0.05, 0)} />
                    </textbutton>
                ))}
            </frame>
        </frame>
    );
}
