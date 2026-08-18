import 'dotenv/config';
import {readFile, writeFile} from 'fs/promises';
import {Message} from "discord.js";

/**
 * Function that read the JSON file from the given path in UTF-8 encoding
 * @param filePath {string} The path of the file from the project root
 * @returns {Promise<any>} A promise containing the content of the file
 */
export async function readJsonFile<T>(filePath: string): Promise<T> {
	const text: string = await readFile(filePath, 'utf8');
	return JSON.parse(text) as T;
}

/**
 * Writes the given JSON content to the given path
 *
 * @param filePath {string} The path of the file from the project root
 * @param content {Object} Content to be written as a JSON
 */
export function writeJsonFile(filePath: string, content: unknown): void {
	const data = JSON.stringify(content);
	writeFile(filePath, data)
		.then(() => { console.log(`Contenu écrit: ${data}`); })
        .catch(console.error);
}

/**
 * Fetch the name of a channel from a message.
 * @param channel Channel from a Message
 */
export function getChannelName(channel: Message["channel"]): string {
    if ("name" in channel) {
        return channel.name ?? channel.id;
    }

    return channel.id;
}