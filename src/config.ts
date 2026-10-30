import dotenv from "dotenv";

dotenv.config();

const { GUILD_ID, PUBLIC_KEY, APP_ID, DISCORD_TOKEN } = process.env;

if (!GUILD_ID || !PUBLIC_KEY || !APP_ID || !DISCORD_TOKEN) {
    throw new Error("Missing environment variables");
}

export const config = {
    GUILD_ID,
    PUBLIC_KEY,
    APP_ID,
    DISCORD_TOKEN
};
