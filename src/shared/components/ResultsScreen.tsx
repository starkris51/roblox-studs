import Roact from "@rbxts/roact";
import { GameResultEntry } from "shared/types/game";
import { Players } from "@rbxts/services";

interface ResultsScreenProps {
    results: GameResultEntry[];
    onContinue: () => void;
}

function getPlayerDisplayName(userId: number): string {
    const player = Players.GetPlayerByUserId(userId);
    return player?.DisplayName || "Unknown Player";
}


export = (props: ResultsScreenProps) => {
    // Sort results by winner first, then by kills (descending)
    const sortedResults = [...props.results];
    sortedResults.sort((a, b) => {
        if (a.winner && !b.winner) return true;
        if (!a.winner && b.winner) return false;
        return b.kills > a.kills;
    });

    return (
        <screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
            <frame
                Size={new UDim2(0.8, 0, 0.8, 0)}
                Position={new UDim2(0.1, 0, 0.1, 0)}
                BackgroundColor3={Color3.fromRGB(30, 30, 30)}
                BorderSizePixel={0}
            >
                <uicorner CornerRadius={new UDim(0, 12)} />
                <uistroke
                    Color={Color3.fromRGB(60, 60, 60)}
                    Thickness={2}
                />

                {/* Header */}
                <textlabel
                    Size={new UDim2(1, 0, 0, 80)}
                    Position={new UDim2(0, 0, 0, 0)}
                    BackgroundTransparency={1}
                    Text="Game Results"
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Font={Enum.Font.GothamBold}
                    TextSize={36}
                    TextScaled={true}
                >
                    <uipadding
                        PaddingTop={new UDim(0, 20)}
                        PaddingBottom={new UDim(0, 20)}
                        PaddingLeft={new UDim(0, 20)}
                        PaddingRight={new UDim(0, 20)}
                    />
                </textlabel>

                {/* Results List */}
                <scrollingframe
                    Size={new UDim2(1, 0, 1, -160)}
                    Position={new UDim2(0, 0, 0, 80)}
                    BackgroundTransparency={1}
                    ScrollBarThickness={8}
                    CanvasSize={new UDim2(0, 0, 0, sortedResults.size() * 60 + 20)}
                >
                    <uilistlayout
                        Padding={new UDim(0, 10)}
                        FillDirection={Enum.FillDirection.Vertical}
                        SortOrder={Enum.SortOrder.LayoutOrder}
                    />
                    <uipadding
                        PaddingTop={new UDim(0, 10)}
                        PaddingBottom={new UDim(0, 10)}
                        PaddingLeft={new UDim(0, 20)}
                        PaddingRight={new UDim(0, 20)}
                    />

                    {sortedResults.map((result, index) => {
                        const totalKills = result.kills;
                        const isWinner = result.winner;
                        
                        return (
                            <frame
                                Size={new UDim2(1, 0, 0, 50)}
                                BackgroundColor3={isWinner ? Color3.fromRGB(46, 204, 113) : Color3.fromRGB(50, 50, 50)}
                                BorderSizePixel={0}
                                LayoutOrder={index}
                            >
                                <uicorner CornerRadius={new UDim(0, 8)} />
                                <uistroke
                                    Color={isWinner ? Color3.fromRGB(39, 174, 96) : Color3.fromRGB(70, 70, 70)}
                                    Thickness={1}
                                />

                                {/* Rank */}
                                <textlabel
                                    Size={new UDim2(0, 60, 1, 0)}
                                    Position={new UDim2(0, 0, 0, 0)}
                                    BackgroundTransparency={1}
                                    Text={`#${index + 1}`}
                                    TextColor3={Color3.fromRGB(255, 255, 255)}
                                    Font={Enum.Font.GothamBold}
                                    TextSize={18}
                                    TextScaled={true}
                                />

                                {/* Player Name */}
                                <textlabel
                                    Size={new UDim2(1, -160, 1, 0)}
                                    Position={new UDim2(0, 60, 0, 0)}
                                    BackgroundTransparency={1}
                                    Text={getPlayerDisplayName(result.userId)}
                                    TextColor3={Color3.fromRGB(255, 255, 255)}
                                    Font={Enum.Font.Gotham}
                                    TextSize={16}
                                    TextScaled={true}
                                    TextXAlignment={Enum.TextXAlignment.Left}
                                >
                                    <uipadding
                                        PaddingLeft={new UDim(0, 10)}
                                        PaddingRight={new UDim(0, 10)}
                                    />
                                </textlabel>

                                {/* Kills */}
                                <textlabel
                                    Size={new UDim2(0, 100, 1, 0)}
                                    Position={new UDim2(1, -100, 0, 0)}
                                    BackgroundTransparency={1}
                                    Text={`${totalKills} Kills`}
                                    TextColor3={Color3.fromRGB(255, 255, 255)}
                                    Font={Enum.Font.Gotham}
                                    TextSize={14}
                                    TextScaled={true}
                                />

                                {isWinner && (
                                    <textlabel
                                        Size={new UDim2(0, 80, 0, 20)}
                                        Position={new UDim2(1, -180, 0, 5)}
                                        BackgroundColor3={Color3.fromRGB(255, 215, 0)}
                                        Text="WINNER!"
                                        TextColor3={Color3.fromRGB(0, 0, 0)}
                                        Font={Enum.Font.GothamBold}
                                        TextSize={12}
                                        TextScaled={true}
                                    >
                                        <uicorner CornerRadius={new UDim(0, 10)} />
                                    </textlabel>
                                )}
                            </frame>
                        );
                    })}
                </scrollingframe>

                {/* Continue Button */}
                <textbutton
                    Size={new UDim2(0, 200, 0, 50)}
                    Position={new UDim2(0.5, -100, 1, -70)}
                    BackgroundColor3={Color3.fromRGB(52, 152, 219)}
                    Text="Continue"
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Font={Enum.Font.GothamBold}
                    TextSize={20}
                    TextScaled={true}
                    AutoButtonColor={true}
                    Event={{
                        MouseButton1Click: props.onContinue,
                    }}
                >
                    <uicorner CornerRadius={new UDim(0, 12)} />
                    <uistroke
                        Color={Color3.fromRGB(41, 128, 185)}
                        Thickness={2}
                    />
                </textbutton>
            </frame>
        </screengui>
    );
};
