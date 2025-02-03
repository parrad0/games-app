import { Game } from "@/models/game";
import { GameBase } from "@/models/GameBase";
import { Player } from "@/models/player";
import { QuizQuestion } from "@/models/quiz-question";
import { Room } from "@/models/room";
import FirebaseService from "@/services/firebaseService";
import { getAllGameInstances, getGameInstance } from "@/services/gameRegistry";
import UtilsService from "@/services/utilsService";

export type GameAction = {
    type: string;
    payload?: any;
};

export type GameConfig = {
    [key: string]: any;
};

export type GameResults = {
    [key: string]: any;
};


export default class GameService {
    private firebaseService: FirebaseService;
    private utilsService: UtilsService;
    private currentGame: GameBase | null = null;
    private games: GameBase[];

    constructor() {
        this.firebaseService = new FirebaseService();
        this.utilsService = new UtilsService();

        this.games = getAllGameInstances();
        console.log('GameService initialized with games:', this.games.length);
    }
    public getGames(): GameBase[] {
        return this.games;
    }

    public async initializeGame(gameId: string): Promise<Game | null> {
        console.log('initializeGame - gameId:', gameId);
        const game = getGameInstance(gameId);
        if (!game) {
            console.error(`Game with ID ${gameId} not found.`);
            return null;
        }

        game.configure();
        this.currentGame = game;

        return {
            id: game.id,
            name: game.name,
            emoji: game.emoji, 
            description: game.description,
            status: game.status as 'initialized' | 'running' | 'ended',
            config: {
                ...game.config,
                status: 'initialized',
            },
            results: {}
        };
    }

    public getCurrentGame(): GameBase | null {
        return this.currentGame;
    }

    public executeAction = async (action: GameAction, room: Room): Promise<void> => {
        if (!room.game) throw new Error('No game found in room');
        const { id: gameId } = room.game;
        const game = getGameInstance(gameId);
        if (!game) throw new Error(`No se encontró el juego con id: ${gameId}`);

        const newConfig = game.handlePlayerAction({ room, action });
        
        await this.updateGameState(room.code, newConfig);
    }

    private updateGameState = async (roomCode: string, config: GameConfig): Promise<void> => {
        console.log("updateGameState - firebaseService:", this.firebaseService);
        await this.firebaseService.update(`rooms/${roomCode}/game`, {
            config,
        });
    }

    public getNextGame(): GameBase | null {        
        const totalGames = this.games.length;
        if (totalGames === 0) {
            console.error('No games available');
            return null;
        }

        const currentGameIndex = this.utilsService.getCurrentGameIndex();
        const gamesPlayed = this.utilsService.getGamesPlayed();

        console.log('Current state:', {
            totalGames,
            currentGameIndex,
            gamesPlayed
        });

        if (gamesPlayed >= totalGames) {
            console.log('All games have been played');
            return null;
        }

        const nextGameIndex = gamesPlayed === 0 ? currentGameIndex : (currentGameIndex + 1) % totalGames;

        console.log('Selected game index:', nextGameIndex);

        this.utilsService.setCurrentGameIndex(nextGameIndex);
        this.utilsService.setGamesPlayed(gamesPlayed + 1);

        const selectedGame = this.configuredGame(this.games[nextGameIndex]);
        console.log('Selected game:', selectedGame?.constructor.name);
        
        return selectedGame;
    }

    private configuredGame(game: GameBase): GameBase {
        game.configure();
        return game;
    }

    public async startGame(): Promise<void> {
        console.log('startGame called');
        const roomCode = this.utilsService.getCurrentRoomCode();
        if (!roomCode) {
            console.error('No room code found');
            return;
        }

        const roomData = await this.firebaseService.read(`rooms/${roomCode}`);
        if (!roomData || !roomData.game) {
            console.error('No game data found in room');
            return;
        }
        
        const gameInstance = getGameInstance(roomData.game.id);
        if (!gameInstance) {
            console.error(`Game instance for ${roomData.game.id} not found`);
            return;
        }

        const config = gameInstance.handlePlayerAction({
            room: roomData,
            action: { type: 'start' },
        });


        await this.updateGameState(roomCode, config);
    }

    public async resetPlayerScores(roomCode: string): Promise<void> {
        const players: Record<string, Player> = await this.firebaseService.read<Record<string, Player>>(`rooms/${roomCode}/players`);
        for (const [uuid, player] of Object.entries(players)) {
            await this.firebaseService.update(`rooms/${roomCode}/players/${uuid}`, {
                score: 0,
            });
        }
    }

    // Métodos auxiliares para Quiz Años
    private getRandomQuestions(questions: QuizQuestion[], count: number) {
        // 1. Shuffle the entire question list
        const shuffledQuestions = [...questions];
        for (let i = shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
        }

        // 2. Slice the first `count` questions
        const selectedQuestions = shuffledQuestions.slice(0, count);

        // 3. For each question, shuffle its options similarly
        const result = selectedQuestions.map(question => {
            const shuffledOptions = [...question.options];
            const correctOption = shuffledOptions[question.correctAnswer];

            // Shuffle these options
            for (let i = shuffledOptions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
            }

            return {
                ...question,
                options: shuffledOptions,
                correctAnswer: shuffledOptions.indexOf(correctOption),
            };
        });

        return result;
    }
}
