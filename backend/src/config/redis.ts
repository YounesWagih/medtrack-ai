import { createClient } from 'redis';
import { env } from './env.js';

const redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
    }
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('ready', () => console.log('Redis Client Ready'));
redisClient.on('reconnecting', () => console.log('Redis Client Reconnecting'));

export async function connectRedis(): Promise<void> {
    try {
        await redisClient.connect();
    } catch (err) {
        console.warn('Redis connection failed. Cache will be disabled:', err);
        // App continues to run without Redis - graceful degradation
    }
}

export async function disconnectRedis(): Promise<void> {
    if (redisClient.isOpen) {
        try {
            await redisClient.quit();
        } catch (err) {
            console.warn('Redis disconnect error:', err);
        }
    }
}

export { redisClient };
