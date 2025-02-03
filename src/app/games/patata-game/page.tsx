'use client';

import { useGame } from '@/hooks/useGame';
import { Room } from '@/models/room';
import GameService from '@/services/gameService';
import RoomService from '@/services/roomService';
import UtilsService from '@/services/utilsService';
import { useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import GameHeader from './components/GameHeader';
import GameOver from './components/GameOver';
import { useRoomRedirect } from '@/hooks/useRoomRedirect';

const utilsService = new UtilsService();
const gameService = new GameService();
const roomService = new RoomService();

export default function Patata() {
    const { room, isHost } = useRoomRedirect();
    const { gameConfig, executeGameAction } = useGame();
    const { explosionTimeout, patataSize, currentPlayer, loser } = gameConfig as {
        explosionTimeout: number;
        patataSize: number;
        currentPlayer: number;
        loser: string;
    };
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [gameFinished, setGameFinished] = useState<boolean>(false);
    const [explosion, setExplosion] = useState<boolean>(false);
    const [hasPatata, setHasPatata] = useState<boolean>(false);

    useEffect(() => {
        if (!gameConfig) return;
        console.log('gameConfig', gameConfig);
        if (gameConfig.status === 'running') {
            setGameStarted(true);
        }

        if (gameConfig.loser) {
            setGameFinished(true);
            const currentPlayerUuid = utilsService.getCurrentPlayerUuid();
            setExplosion(currentPlayerUuid === gameConfig.loser);

            roomService.updateScores(room?.code as string);
        }
    }, [gameConfig?.status, gameConfig?.loser]);

    useEffect(() => {
        if (!gameStarted || gameFinished || !room?.players || !gameConfig) return;

        const currentPlayerUuid = utilsService.getCurrentPlayerUuid();
        const playersArray = Object.entries(room.players)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([_, player]) => player);
        
        const currentPlayerIndex = playersArray.findIndex(
            player => player.uuid === currentPlayerUuid
        );
        
        setHasPatata(currentPlayerIndex === gameConfig.currentPlayer);
    }, [gameConfig?.currentPlayer, gameStarted, gameFinished, room?.players]);

    const handlePatataClick = async () => {
        if (!hasPatata || !room?.players) return;

        const players = Object.entries(room.players)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([_, player]) => player);
        
        const currentPlayerIndex = players.findIndex(
            player => player.uuid === utilsService.getCurrentPlayerUuid()
        );
        
        await executeGameAction({
            type: 'patata/pass',
            payload: {
                currentSize: patataSize,
                currentPlayer: currentPlayerIndex
            }
        }, room as Room);
    };

    const handleStartGame = async () => {
        try {
            if (!room?.game?.id) {
                console.error('No game ID found');
                return;
            }
            console.log('room.game.id', room.game.id);
            await gameService.initializeGame(room.game.id);
            await gameService.startGame();
        } catch (error) {
            console.error('Error starting game:', error);
        }
    };

    const handleExplode = async () => {
        await executeGameAction({
            type: 'patata/explode',
            payload: {
                playerUuid: utilsService.getCurrentPlayerUuid()
            }
        }, room as Room);
    };

    const goToRanking = () => {
        if (!isHost || !room?.code) return;
        
        roomService.updateScores(room.code);
        roomService.initializeGame(room.code as string);
    };

    return (
        <div className="h-screen bg-white pt-16 px-4">
            <main className="w-full max-w-md mx-auto">
                {!gameStarted && !gameFinished && (
                    <GameHeader
                        isHost={isHost}
                        startGame={handleStartGame}
                    />
                )}

                {gameStarted && !gameFinished && (
                    <GameBoard
                        hasPatata={hasPatata}
                        patataSize={patataSize}
                        onPatataClick={handlePatataClick}
                        explosionTimeout={explosionTimeout}
                        onExplode={handleExplode}
                    />
                )}

                {gameFinished && (
                    <GameOver
                        explosion={explosion}
                        hasPatata={hasPatata}
                        isHost={isHost}
                        goToRanking={goToRanking}
                    />
                )}
            </main>
        </div>
    );
}
