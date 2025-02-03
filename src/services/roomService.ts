import { Player } from "@/models/player";
import { Room } from "@/models/room";
import FirebaseService from "@/services/firebaseService";
import { getGameInstance } from "@/services/gameRegistry";
import GameService from "@/services/gameService";
import UtilsService from "@/services/utilsService";

export default class RoomService {
    private static ROOM_AVAILABLE_CHARS_LETTERS: string = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    private static ROOM_AVAILABLE_CHARS_NUMBERS: string = '23456789';

    private firebaseService: FirebaseService;
    private gameService: GameService;
    private utilsService: UtilsService;

    constructor() {
        this.firebaseService = new FirebaseService();
        this.gameService = new GameService();
        this.utilsService = new UtilsService();
    }

    public newRoom(): Room {
        const room: Room = {
            code: this.getRandomCode(),
            players: [],
            status: 'created',
            game: null,
            createdAt: new Date().toISOString(),
        };

        this.firebaseService.write(`rooms/${room.code}`, room);

        return room;
    }

    public async joinRoom(roomCode: string, player: Player): Promise<void> {
        await this.addPlayerToRoom(roomCode, player);

        if (player.isHost) {
            sessionStorage.setItem('host', "host");
        }

        sessionStorage.setItem('roomCode', roomCode);
        sessionStorage.setItem('playerUuid', player.uuid);
    }

    public subscribeToRoom(roomCode: string, callback: (room: Room | null) => void): () => void {
        return this.firebaseService.subscribe<Room>(`rooms/${roomCode}`, callback);
    }

    public async changeRoomStatus(room: Room, status: string): Promise<void> {
        await this.firebaseService.update(`rooms/${room.code}`, {status});
    }

    private async addPlayerToRoom(roomCode: string, player: Player): Promise<void> {
        return await this.firebaseService.write(`rooms/${roomCode}/players/${player.uuid}`, player);
    }

    public async initializeGame(roomCode: string, firstGame: boolean = false): Promise<void> {
        if (firstGame) {
            console.log('Initializing first round...');
            await this.gameService.resetPlayerScores(roomCode);
            await this.resetGameState();
        }

        const nextGame = this.gameService.getNextGame();
        console.log('Next game:', nextGame?.id, nextGame?.constructor.name);
        
        if (!nextGame) {
            console.log('No more games available, ending room...');
            await this.endRoom(roomCode);
            return;
        }

        // Inicializar el juego y actualizar la sala
        const gameData = await this.gameService.initializeGame(nextGame.id);
        if (!gameData) {
            console.error('Failed to initialize game:', nextGame.id);
            return;
        }

        await this.firebaseService.update(`rooms/${roomCode}`, {
            status: 'playing',
            game: gameData
        });
    }

    private async resetGameState(): Promise<void> {
        this.utilsService.setGamesPlayed(0);
        this.utilsService.setCurrentGameIndex(0);
        console.log('Reset game state:', {
            gamesPlayed: this.utilsService.getGamesPlayed(),
            currentGameIndex: this.utilsService.getCurrentGameIndex()
        });
    }

    public async endRoom(roomCode: string): Promise<void> {
        const status = 'ended';

        await this.firebaseService.update(`rooms/${roomCode}`, {status});
    }

    public async updateScores(roomCode: string): Promise<void> {
        const room: Room = await this.firebaseService.read(`rooms/${roomCode}`);
        if (!room || !room.game) return;

        const gameInstance = getGameInstance(room.game.id);
        if (!gameInstance) {
            console.error(`Juego con id ${room.game.id} no encontrado.`);
            return;
        }
        
        // Actualizar los puntajes directamente en los jugadores
        gameInstance.getScoringResults(room);
        const players = room.players as unknown as Record<string, Player>;

        for (const playerUuid in players) {
            const player = players[playerUuid];
            await this.firebaseService.update(`rooms/${roomCode}/players/${playerUuid}`, {
                score: player.score,
            });
        }
    }

    private getRandomCode(): string {
        const getRandomChars = (chars: string, length: number) => {
            return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        }

        const a = getRandomChars(RoomService.ROOM_AVAILABLE_CHARS_LETTERS, 2);
        const b = getRandomChars(RoomService.ROOM_AVAILABLE_CHARS_NUMBERS, 2);

        return `${a}${b}`;
    }
}
