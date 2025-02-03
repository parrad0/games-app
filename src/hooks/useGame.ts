import { useState, useEffect } from 'react';
import GameService from '@/services/gameService';
import RoomService from '@/services/roomService';
import UtilsService from '@/services/utilsService';
import { Room } from '@/models/room';
import { GameAction } from '@/services/gameService';

const gameService = new GameService();
const roomService = new RoomService();
const utilsService = new UtilsService();

interface GameConfig {
    [key: string]: any;
}

export const useGame = () => {
    const [gameConfig, setGameConfig] = useState<GameConfig>({});
    const [gameResults, setGameResults] = useState({});
    const [room, setRoom] = useState<Room | null>(null);

    useEffect(() => {
        const roomCode = utilsService.getCurrentRoomCode();
        if (!roomCode) return;

        const unsubscribe = roomService.subscribeToRoom(roomCode, (updatedRoom) => {
            setRoom(updatedRoom);
            if (updatedRoom?.game) {
                setGameConfig(updatedRoom.game.config || {});
                setGameResults(updatedRoom.game.results || {});
            }
        });

        return () => unsubscribe();
    }, []);

    const executeGameAction = async (action: GameAction, room: Room) => {
        await gameService.executeAction(action, room);
    };

    return {
        room,
        currentGame: gameService.getCurrentGame(),
        gameConfig,
        gameResults,
        executeGameAction,
    };
}; 