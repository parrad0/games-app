import { Player } from "./player";
import { Room } from "./room";
import { GameAction } from "@/services/gameService";

/**
 * Representa la configuración mínima (o genérica) que comparten los juegos.
 * Si en tu proyecto cada juego maneja un config distinto, considera usar
 * interfaces específicas en cada clase, y downcast en tiempo de uso.
 */
export interface GameConfig {
    [key: string]: any;
}

export interface GameResults {
    [key: string]: any;
}

export abstract class GameBase {
    abstract id: string;
    abstract name: string;
    abstract emoji: string;
    abstract description: string;
    abstract status: string;
    config: GameConfig = {};
    results: GameResults = {};

    // Tipo abstracto que cada juego debe definir
    abstract readonly ActionTypes: { [key: string]: string };
    
    // Método para validar que la acción es válida para este juego
    protected abstract isValidAction(action: GameAction): boolean;

    // Método para manejar la acción de un jugador
    handlePlayerAction({ room, action }: {
        room: Room,
        action: GameAction,
    }): GameResults {
        if (!this.isValidAction(action)) {
            throw new Error(`Invalid action ${action.type} for game ${this.id}`);
        }

        try {
            const result = this.executeAction(action, room);
            return result;
        } catch (error) {
            console.error(`Error executing action ${action.type}:`, error);
            throw error;
        }
    }

    protected abstract executeAction(
        action: GameAction, 
        room: Room,
    ): GameResults;

    // Métodos que cada juego debe implementar
    abstract configure(): void;
    abstract getScoringResults(room: Room): GameResults;
    abstract validateResult(result: any): boolean;
} 