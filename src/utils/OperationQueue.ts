/**
 * Represents a value that can be returned either synchronously or asynchronously.
 *
 * @template T The type of the operation's result.
 */
export type Operation<T> = T | Promise<T>;

/**
 * Provides a per-resource asynchronous operation queue.
 *
 * Operations associated with the same resource are executed sequentially,
 * while operations associated with different resources can run concurrently.
 *
 * This class can be used to prevent race conditions when multiple asynchronous
 * events may access or modify the same resource.
 *
 * @template T The type used to identify a resource.
 *
 * @example
 * ```typescript
 * const queue = new OperationQueue<Snowflake>();
 *
 * await queue.run("123456", async () => {
 *     const messages = await fetchGuildMemberMessages();
 *     await deleteMessagesFromGuildMember(messages);
 * });
 * ```
 *
 * Multiple operations queued for the same resource are executed in order:
 *
 * ```text
 * Operation A ──► Operation B ──► Operation C
 * ```
 *
 * Operations associated with different resources are not blocked by each other:
 *
 * ```text
 * Resource 123456: Operation A ──► Operation B
 *
 * Resource 654321: Operation C ──► Operation D
 * ```
 */
export default class OperationQueue<T> {
    private queue = new Map<T, Promise<void>>();

    /**
     * Executes an operation while ensuring that no other operation for the
     * same resource is running concurrently.
     *
     * If another operation is already running or queued for the given resource,
     * this operation waits for it to complete before starting.
     *
     * The operation may be synchronous or asynchronous.
     *
     * The lock is always released after the operation completes, whether it
     * succeeds or throws an error.
     *
     * @template R The type of the operation's result.
     *
     * @param resource The resource to lock. Operations using the same resource
     * are executed sequentially.
     * @param operation The operation to execute. It may return either a value
     * directly or a Promise.
     *
     * @returns A Promise that resolves with the operation's result.
     *
     * @throws Any error thrown by the operation is propagated to the caller.
     *
     * @example
     * ```typescript
     * const result = await queue.run("123456", async () => {
     *     return await fetchGuildMemberMessages();
     * });
     * ```
     *
     * @example
     * Synchronous operations are also supported:
     *
     * ```typescript
     * await queue.run("123456", () => {
     *     users.delete("123456");
     * });
     * ```
     */
    async run<R>(resource: T, operation: () => Operation<R>): Promise<R> {
        const previous = this.queue.get(resource) ?? Promise.resolve();

        let release!: () => void;

        const current = new Promise<void>(resolve => {
            release = resolve;
        });

        this.queue.set(resource, current);

        await previous;

        try {
            return await operation();
        } finally {
            release();

            if (this.queue.get(resource) === current) {
                this.queue.delete(resource);
            }
        }
    }
}