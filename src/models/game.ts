export interface Game {
    id: string
    name: string;
    emoji: string;
    description: string;
    status: 'initialized' | 'running' | 'ended';
    config: any;
    results: Record<string, number>;
}
