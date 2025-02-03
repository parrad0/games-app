import { GameBase, GameConfig, GameResults } from "@/models/GameBase";
import { Player } from "@/models/player";
import { Room } from "@/models/room";
import { GameAction } from "@/services/gameService";

export enum PatataActionTypes {
    PASS = 'patata/pass',
    EXPLODE = 'patata/explode',
    START_GAME = 'start',
    NOTIFY_EXPLOSION = 'patata/notifyExplosion'
}

interface PassPatataPayload {
    currentPlayer: number;
}

interface ExplodePayload {
    playerUuid: string;
}

export type PatataAction = 
    | { type: PatataActionTypes.START_GAME }
    | { type: PatataActionTypes.PASS; payload: PassPatataPayload }
    | { type: PatataActionTypes.EXPLODE; payload: ExplodePayload }
    | { type: PatataActionTypes.NOTIFY_EXPLOSION; payload: ExplodePayload };

export interface PatataGameConfig extends GameConfig {
    explosionTime: number;
    currentPlayer: number;
    gameStartTime: number;
    explosionTimeout: number;
    patataSize: number;
    loser: string | null;
    status: 'initialized' | 'running' | 'exploded' | 'ended';
}

export class PatataGame extends GameBase {
    id = 'patata-game';
    name = 'Patata Caliente';
    emoji = '🥔';
    description = '¡Pasa la patata antes de que explote!';
    readonly ActionTypes = PatataActionTypes;
    status: 'initialized' | 'running' | 'ended' = 'initialized';
    
    /**
     * Crea y devuelve una nueva configuración sin modificar el estado interno.
     */
    public configure(): PatataGameConfig {
        const minTime = 20;
        const maxTime = 40;
        const explosionTime = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
        const now = Date.now();

        return {
            explosionTime,
            currentPlayer: 0,
            gameStartTime: now,
            explosionTimeout: now + explosionTime * 1000,
            patataSize: 100,
            loser: null,
            status: 'initialized',
        };
    }

    /**
     * Ejecuta la acción recibida utilizando la configuración pasada (desde room) o,
     * en caso de START_GAME, creando una nueva configuración.
     */
    protected executeAction(
        action: GameAction,
        room: Room,
    ): GameResults {
        if (!this.isValidAction(action)) {
            throw new Error(`Unhandled or invalid action type: ${action.type}`);
        }
        const patataAction = action as PatataAction;
        let config: PatataGameConfig;
        const players = Object.values(room.players);
        let result: GameResults;

        switch (patataAction.type) {
            case PatataActionTypes.START_GAME: {
                config = this.configure();
                result = { ...config, status: 'running' };
                break;
            }
            case PatataActionTypes.PASS: {
                config = (room.game?.config as PatataGameConfig) || this.configure();
                const { currentPlayer } = patataAction.payload;
                const { nextPlayerIndex, newSize } = this.passPatataToNextPlayer(currentPlayer, players.length, config);
                result = {
                    ...config,
                    currentPlayer: nextPlayerIndex,
                    patataSize: newSize,
                    status: 'running',
                };
                break;
            }
            case PatataActionTypes.EXPLODE:
            case PatataActionTypes.NOTIFY_EXPLOSION: {
                config = (room.game?.config as PatataGameConfig) || this.configure();
                const { playerUuid } = patataAction.payload;
                result = {
                    ...config,
                    loser: playerUuid,
                    status: 'exploded',
                };
                break;
            }
            default: {
                throw new Error(`Unhandled action type: ${patataAction}`);
            }
        }
        return result;
    }

    passPatataToNextPlayer(
        currentIndex: number, 
        totalPlayers: number, 
        config: PatataGameConfig
    ): { nextPlayerIndex: number, remainingTime: number, newSize: number } {
        if (totalPlayers <= 0) {
            throw new Error('No hay jugadores suficientes');
        }

        const nextPlayerIndex = (currentIndex + 1) % totalPlayers;
        const currentTime = Date.now();
        const remainingTime = Math.max(0, config.explosionTimeout - currentTime);
        
        const maxSize = 300;
        const minSize = 100;
        const sizeIncrement = 50;
        const newSize = Math.min(maxSize, Math.max(minSize, config.patataSize + sizeIncrement));

        return {
            nextPlayerIndex,
            remainingTime,
            newSize
        };
    }

    protected isValidAction(action: GameAction): action is PatataAction {
        return Object.values(PatataActionTypes).includes(action.type as PatataActionTypes);
    }

    validateResult(result: any): boolean {
        for (let i = 0; i < result.length - 1; i++) {
            if (result[i] < result[i + 1]) return false;
        }
        return true;
    }

    getScoringResults(room: Room): Record<string, Player> {
        const players = room.players as unknown as Record<string, Player>;
        const loserUuid = room.game?.config.loser;

        Object.keys(players).forEach(playerUuid => {
            const player = players[playerUuid];
            player.score = (playerUuid === loserUuid) ? 0 : 1;
        });

        return players;
    }
} 