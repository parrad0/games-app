import { NumerosOrdenGame } from "@/games/NumerosOrdenGame";
import { PatataGame } from "@/games/PatataGame";
import { GameBase } from "@/models/GameBase";
// Importa otros juegos según sea necesario

const gameRegistry: Record<string, () => GameBase> = {
    'patata-game': () => new PatataGame(),
    'numeros-orden': () => new NumerosOrdenGame(),
    // Registra otros juegos aquí
};

export const getGameInstance = (gameId: string): GameBase | null => {
    const createGame = gameRegistry[gameId];
    if (createGame) {
        return createGame();
    }
    return null;
};

export const getAllGameInstances = (): GameBase[] => {
    return Object.keys(gameRegistry)
        .map(gameId => gameRegistry[gameId]())
        .filter(game => game !== null);
}; 

