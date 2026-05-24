import { createClient } from 'redis';
import { env } from './env.js';

const MAX_REDIS_RETRIES = 5;
let redisRetryCount = 0;
let redisGracefulDegrade = false;

const redisClient = createClient({
    url: env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries >= MAX_REDIS_RETRIES) {
                redisGracefulDegrade = true;
                console.warn(`Redis max retries (${MAX_REDIS_RETRIES}) exceeded. Cache disabled.`);
                return false;
            }
            redisRetryCount = retries;
            const delay = Math.min(retries * 50, 2000);
            console.log(`Redis reconnecting... attempt ${retries + 1}/${MAX_REDIS_RETRIES}`);
            return delay;
        }
    }
});

redisClient.on('error', (err) => {
    if (!redisGracefulDegrade) {
        console.error('Redis Client Error:', err);
    }
});
redisClient.on('connect', () => {
    redisRetryCount = 0;
    redisGracefulDegrade = false;
    console.log('Redis Client Connected');
});
redisClient.on('ready', () => console.log('Redis Client Ready'));
redisClient.on('reconnecting', () => {
    if (!redisGracefulDegrade) {
        console.log('Redis Client Reconnecting');
    }
});

export async function connectRedis(): Promise<void> {
    if (redisGracefulDegrade) {
        console.warn('Redis cache disabled due to previous connection failures');
        return;
    }
    try {
        await redisClient.connect();
    } catch (err) {
        console.warn('Redis connection failed. Cache will be disabled:', err);
        redisGracefulDegrade = true;
    }
}

export function isRedisAvailable(): boolean {
    return !redisGracefulDegrade && redisClient.isOpen;
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
