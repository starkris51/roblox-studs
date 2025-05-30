export enum PlayerState {
    Idle,
    Moving,
    Attacking,
    Dead,
}

export enum PlayerGameState {
    Lobby,
    Voting,
    Playing,
}

export enum PlayerDirection {
    Up,
    Down,
    Left,
    Right,
    UpLeft,
    UpRight,
    DownLeft,
    DownRight,
    None,
}