import Roact from "@rbxts/roact";
import { Powerups } from "shared/enums/game";

interface PowerupProps {
    powerupType: Powerups;
}

const powerupNames: Record<Powerups, string> = {
    [Powerups.FourLine]: "Four Line",
    [Powerups.Shotgun]: "Shotgun",
    [Powerups.Speed]: "Speed Boost",
    [Powerups.Slowdown]: "Slowdown",
    [Powerups.Teleport]: "Teleport",
    [Powerups.Health]: "Health",
    [Powerups.Shield]: "Shield",
    [Powerups.Dizzy]: "Dizzy",
    [Powerups.Invincibility]: "Invincibility",
    [Powerups.Earthquake]: "Earthquake",
    [Powerups.RespawnRandomPlayer]: "Respawn Player",
    [Powerups.IncreaseStageSize]: "Increase Stage",
    [Powerups.DisableAttack]: "Disable Attack",
    [Powerups.IncreaseAttackRange]: "Increase Range",
};

export = (props: PowerupProps) => {
    const powerupName = powerupNames[props.powerupType] || "Unknown";
    
    return (
        <screengui ResetOnSpawn={false} IgnoreGuiInset={true}>
            <frame
                Size={new UDim2(0.25, 0, 0.12, 0)}
                Position={new UDim2(0.75, 0, 0.1, 0)}
                BackgroundColor3={Color3.fromRGB(50, 50, 80)}
                BorderSizePixel={2}
                BorderColor3={Color3.fromRGB(100, 100, 200)}
            >
                <uicorner CornerRadius={new UDim(0, 8)} />
                <textlabel
                    Size={new UDim2(1, 0, 0.4, 0)}
                    Position={new UDim2(0, 0, 0.1, 0)}
                    BackgroundTransparency={1}
                    Text="POWERUP"
                    TextColor3={Color3.fromRGB(200, 200, 255)}
                    Font={Enum.Font.GothamBold}
                    TextSize={16}
                    TextScaled={true}
                />
                <textlabel
                    Size={new UDim2(1, 0, 0.4, 0)}
                    Position={new UDim2(0, 0, 0.5, 0)}
                    BackgroundTransparency={1}
                    Text={powerupName}
                    TextColor3={Color3.fromRGB(255, 255, 255)}
                    Font={Enum.Font.Gotham}
                    TextSize={20}
                    TextScaled={true}
                />
                <textlabel
                    Size={new UDim2(1, 0, 0.2, 0)}
                    Position={new UDim2(0, 0, 0.8, 0)}
                    BackgroundTransparency={1}
                    Text="Press Q to use"
                    TextColor3={Color3.fromRGB(150, 150, 150)}
                    Font={Enum.Font.Gotham}
                    TextSize={12}
                    TextScaled={true}
                />
            </frame>
        </screengui>
    );
}