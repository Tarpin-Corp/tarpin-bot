import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';

export async function DiscordRequest(endpoint, options) {
	// append endpoint to root API URL
	const url = 'https://discord.com/api/v10/' + endpoint;
	// Stringify payloads
	if (options.body) options.body = JSON.stringify(options.body);
	// Use fetch to make requests
	const res = await fetch(url, {
		headers: {
			Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
			'Content-Type': 'application/json; charset=UTF-8',
			'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
		},
		...options,
	});
	// throw API errors
	if (!res.ok) {
		const data = await res.json();
		console.log(res.status);
		throw new Error(JSON.stringify(data));
	}
	// return original response
	return res;
}

export async function InstallGlobalCommands(appId, commands) {
	// API endpoint to overwrite global commands
	const endpoint = `applications/${appId}/commands`;

	try {
		// This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
		await DiscordRequest(endpoint, { method: 'PUT', body: commands });
	}
	catch (err) {
		console.error(err);
	}
}

/**
 * Function that read the JSON file from the given path in UTF-8 encoding
 * @param filePath {string} The path of the file from the project root
 * @returns {Promise<any>} A promise containing the content of the file
 */
export async function readJsonFile(filePath) {
	const text = await readFile(filePath, 'utf8');
	return JSON.parse(text);
}

/**
 * Writes the given JSON content to the given path
 *
 * @param filePath {string} The path of the file from the project root
 * @param content {Object} Content to be written as a JSON
 */
export function writeJsonFile(filePath, content) {
	writeFile(filePath, JSON.stringify(content))
		.then(() => console.log(`Contenu écrit: ${content}`));
}