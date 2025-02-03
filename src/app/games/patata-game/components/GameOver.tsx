import React from 'react';

interface GameOverProps {
    explosion: boolean;
    hasPatata: boolean;
    isHost: boolean;
    goToRanking: () => void;
}

export default function GameOver({ explosion, hasPatata, isHost, goToRanking }: GameOverProps) {
    return (
        <div className="text-center space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                    ¡Juego Terminado!
                </h2>
                <div className="text-6xl py-4">
                    {explosion ? '💥' : '🎮'}
                </div>
                <p className="text-gray-600">
                    {explosion 
                        ? '¡Has perdido! La patata explotó en tus manos' 
                        : '¡Enhorabuena! Sobreviviste'}
                </p>
            </div>

            {isHost && (
                <button
                    onClick={goToRanking}
                    className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    🏆 Ir al ranking
                </button>
            )}
        </div>
    );
} 