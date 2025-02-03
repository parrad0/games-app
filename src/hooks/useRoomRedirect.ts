import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoomService from "@/services/roomService";
import { Room } from "@/models/room";
import UtilsService from "@/services/utilsService";
import FirebaseService from "@/services/firebaseService";

const firebaseService = new FirebaseService();
const roomService = new RoomService();
const utilsService = new UtilsService();

export const useRoomRedirect = () => {
    const [room, setRoom] = useState<Room | null>(null);
    const [isHost, setIsHost] = useState<boolean>(false);

    const router = useRouter();

    useEffect(() => {
        const currentRoomCode = utilsService.getCurrentRoomCode();
        if (!currentRoomCode) {
            router.push('/');
            return;
        }

        firebaseService.read<Room>(`rooms/${currentRoomCode}`).then((initialRoom) => {
            redirectBasedOnRoomStatus(initialRoom);
        });

        // Suscribirse a cambios en la sala
        const unsubscribe = roomService.subscribeToRoom(currentRoomCode, (updatedRoom) => {
            setRoom(updatedRoom);
            setIsHost(utilsService.isHost());
            redirectBasedOnRoomStatus(updatedRoom);
        });

        return () => unsubscribe();
    }, [router]);

    const redirectBasedOnRoomStatus = (currentRoom: Room | null) => {
        if (!currentRoom) {
            console.log('No room found, redirecting to home');
            router.push('/');
            return;
        }

        // Según el estado del room en su raíz
        switch (currentRoom.status) {
            case 'created':
                console.log('Room created, redirecting to home');
                router.push('/');
                break;

            case 'waiting':
                console.log('Room waiting, redirecting to waiting');
                router.push('/sala-espera');
                break;

            case 'playing':
                /**
                 * Ahora distinguimos el sub-estado del juego en `config.status`.
                 * 
                 * Por ejemplo:
                 *   - 'initialized' ⇒ Llevamos al usuario a la pantalla del juego,
                 *       pero mostrando el botón "Empezar" (todavía no corre la lógica).
                 *   - 'running' ⇒ El juego ya está en marcha; mostramos la UI del juego.
                 *   - 'ended' ⇒ Partida terminada; a lo mejor lo tratamos igual que ranking o ended.
                 */
                switch (currentRoom.game?.config?.status) {
                    case 'initialized':
                        // El juego está listo pero no arrancado
                        console.log('initialized');
                        router.push(`/games/${currentRoom.game.id}`);
                        break;
                    case 'running':
                        // El juego ya está en pleno funcionamiento
                        console.log('running');
                        router.push(`/games/${currentRoom.game.id}`);
                        break;
                    case 'ended':
                        // Si tu PatataGame marca ended aquí
                        console.log('ended');
                        router.push('/resultados');
                        break;
                    default:
                        // fallback si no hay config/status (o no lo has definido)
                        console.log('default');
                        router.push(`/games/${currentRoom.game?.id}`);
                        break;
                }
                break;

            case 'ranking':
            case 'ended':
                router.push('/resultados');
                break;

            default:
                router.push('/');
                break;
        }
    };

    return { room, isHost };
};
