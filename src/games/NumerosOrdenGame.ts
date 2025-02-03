import { GameBase } from "@/models/GameBase";
import { GameResults } from "@/models/GameBase";
import { Player } from "@/models/player";
import { Room } from "@/models/room";
import { GameAction } from "@/services/gameService";

export class NumerosOrdenGame extends GameBase {
    id = 'numeros-orden';
    name = 'Números en Orden';
    emoji = '🔢';
    description = 'Ordena los números de mayor a menor';
    status: 'initialized' | 'running' | 'ended' = 'initialized';

    ActionTypes = {
        REPORT_RESULT: 'report-result',
        START_GAME: 'start'
    };

    isValidAction(action: GameAction): boolean {
        return action.type === this.ActionTypes.START_GAME;
    }

    configure(): void {
        // Generate 9 unique random numbers between 1 and 100
        const nums = new Set<number>();
        while (nums.size < 9) {
            nums.add(Math.floor(Math.random() * 100) + 1);
        }
        this.config = {
            numbers: Array.from(nums)
        };
    }

    executeAction(action: GameAction, room: Room): GameResults {
        switch (action.type) {
            case this.ActionTypes.START_GAME: {
                // Configura el juego y establece el estado a "running"
                this.configure();
                return {
                    ...this.config,
                    status: 'running'
                };
            }
            default:
                throw new Error(`Unhandled action type: ${action.type}`);
        }
    }

    validateResult(result: number[]): boolean {
        // Validar que el resultado está ordenado de mayor a menor
        for (let i = 0; i < result.length - 1; i++) {
            if (result[i] < result[i + 1]) return false;
        }
        return true;
    }

    getScoringResults(room: Room): Record<string, Player> {
        const players = room.players as unknown as Record<string, Player>;

        Object.keys(players).forEach(playerUuid => {
            const player = players[playerUuid];
            // Calculate score based on game logic
            // Assuming some logic to determine if the player has completed the task correctly
            const hasCompletedCorrectly = true; // Placeholder for actual logic
            player.score = hasCompletedCorrectly ? 1 : 0;
        });

        return players;
    }
} 