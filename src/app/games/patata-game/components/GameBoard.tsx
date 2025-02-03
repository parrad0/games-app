import React, { useEffect, useState } from 'react';

interface GameBoardProps {
    hasPatata: boolean;
    patataSize: number;
    onPatataClick: () => void;
    explosionTimeout: number;
    onExplode?: () => void;
}

export default function GameBoard({ hasPatata, patataSize, onPatataClick, explosionTimeout, onExplode }: GameBoardProps) {
    const [currentSize, setCurrentSize] = useState(patataSize);
    const [hasExploded, setHasExploded] = useState(false);
    const growthRate = 2; // Pixels to grow per second (más lento)
    const updateInterval = 100; // Actualizar cada 100ms para un crecimiento más suave
    const maxSize = 500; // Tamaño máximo más grande

    useEffect(() => {
        setCurrentSize(patataSize);
    }, [patataSize]);

    useEffect(() => {
        if (!hasPatata || hasExploded) return;

        const currentTime = Date.now();
        const remainingTime = explosionTimeout - currentTime;

        if (remainingTime <= 0) {
            setHasExploded(true);
            return;
        }

        const timeInterval = setInterval(() => {
            const now = Date.now();
            if (explosionTimeout - now <= 0) {
                setHasExploded(true);
                clearInterval(timeInterval);
            }
        }, 100);

        const growInterval = setInterval(() => {
            setCurrentSize(prevSize => {
                // Crecimiento exponencial suave
                const growth = (prevSize * 0.01) + growthRate;
                const newSize = prevSize + growth;
                return newSize > maxSize ? maxSize : newSize;
            });
        }, updateInterval);

        return () => {
            clearInterval(growInterval);
            clearInterval(timeInterval);
        };
    }, [hasPatata, explosionTimeout, hasExploded]);

    useEffect(() => {
        if (hasExploded && onExplode) {
            onExplode();
        }
    }, [hasExploded, onExplode]);

    if (!hasPatata) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Esperando la patata...</p>
            </div>
        );
    }

    if (hasExploded) {
        return (
            <div className="text-center py-12 space-y-4">
                <div className="text-6xl animate-bounce">💥</div>
                <p className="text-red-600 font-bold text-2xl">¡BOOM!</p>
                <p className="text-gray-600">¡Has perdido!</p>
            </div>
        );
    }

    const fontSize = `${currentSize * 0.7}px`;
    const shakeFactor = Math.min((currentSize - patataSize) / 200, 1);
    const shakeClass = shakeFactor > 0.3 ? 'animate-shake' : '';

    return (
        <div className="space-y-4">
            <div className="flex justify-center items-center">
                <button
                    onClick={onPatataClick}
                    style={{
                        width: `${currentSize}px`,
                        height: `${currentSize}px`,
                        fontSize: fontSize,
                        lineHeight: `${currentSize}px`,
                        animationDuration: `${0.5 - shakeFactor * 0.3}s`
                    }}
                    className={`transition-all duration-300 hover:scale-105 flex items-center justify-center ${shakeClass}`}
                >
                    🥔
                </button>
            </div>
        </div>
    );
} 