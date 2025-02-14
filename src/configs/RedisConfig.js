import { createClient } from "redis";

let redisClient;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: "redis://redis:6379" });

    redisClient.on("error", (err) => console.error("Redis Client Error", err));

    await redisClient.connect();
    console.log("Successfully connect to redis");
  }
  return redisClient;
}
