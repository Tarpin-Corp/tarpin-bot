/**
 * Classe qui effectue des opérations threadSafe sur une ressources.
 * Elle garde une Map de la ressource en question, allié à un verrou
 *
 * Il faut que cette ressource soit unique pour les opérations à effectuer.
 * Par exemple un Snowflake de membre de guilde par exemple pour gérer des opérations sur des membres.
 */
export default class ResourcesLock {

	constructor() {
		this.locks = new Map();
	}

	/**
	 * Effectue une opération en appliquant un verrou autour de la ressource donnée
	 *
	 * @param resource Resource sur laquel basée le verrou
	 * @param operation Opération à effectuer
	 * @returns {Promise<*>} Une promesse sur le résultat de l'opération donné
	 */
	async run(resource, operation) {
		const previous = this.locks.get(resource) ?? Promise.resolve();

		let release;

		const current = new Promise(resolve => {
			release = resolve;
		});

		this.locks.set(resource, current);

		await previous;

		try {
			return await operation();
		}
		finally {
			release();

			if (this.locks.get(resource) === current) {
				this.locks.delete(resource);
			}
		}
	}
}
