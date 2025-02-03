import React from 'react';

interface GameHeaderProps {
    isHost: boolean;
    startGame: () => void;
}

export default function GameHeader({ isHost, startGame }: GameHeaderProps) {
    return (
        <div className="text-center space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Patata Caliente</h1>
            <p className="text-gray-600">
                ¡Pasa la patata antes de que explote!
            </p>
            <p className="text-sm text-gray-500">
                Toca la patata para pasarla al siguiente jugador
            </p>
            <p className="text-sm text-gray-500">
                La patata irá creciendo con cada pase... ¡hasta que explote!
            </p>
            {isHost && (
                <button
                    onClick={startGame}
                    className="w-full max-w-md mx-auto py-3 px-6 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                    🕹️️ Confirmar inicio
                </button>
            )}
        </div>
    );
} 