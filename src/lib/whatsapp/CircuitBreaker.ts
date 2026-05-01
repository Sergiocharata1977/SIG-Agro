export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RECOVERY_TIMEOUT_MS = 30_000;

export class CircuitBreakerOpenError extends Error {
    readonly retryAfterMs: number;

    constructor(retryAfterMs: number) {
        super(`Circuit breaker is OPEN. Retry after ${retryAfterMs}ms.`);
        this.name = 'CircuitBreakerOpenError';
        this.retryAfterMs = retryAfterMs;
    }
}

export class CircuitBreaker {
    private state: CircuitBreakerState = 'CLOSED';
    private consecutiveFailures = 0;
    private openedAt?: number;

    constructor(
        private readonly failureThreshold = DEFAULT_FAILURE_THRESHOLD,
        private readonly recoveryTimeoutMs = DEFAULT_RECOVERY_TIMEOUT_MS
    ) {}

    getState(): CircuitBreakerState {
        return this.state;
    }

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        this.transitionToHalfOpenIfReady();

        if (this.state === 'OPEN') {
            const retryAfterMs = this.getRetryAfterMs();
            throw new CircuitBreakerOpenError(retryAfterMs);
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.consecutiveFailures = 0;
        this.openedAt = undefined;
        this.state = 'CLOSED';
    }

    private onFailure(): void {
        this.consecutiveFailures += 1;

        if (this.consecutiveFailures >= this.failureThreshold) {
            this.state = 'OPEN';
            this.openedAt = Date.now();
            return;
        }

        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.openedAt = Date.now();
        }
    }

    private transitionToHalfOpenIfReady(): void {
        if (this.state !== 'OPEN' || this.openedAt === undefined) {
            return;
        }

        if (Date.now() - this.openedAt >= this.recoveryTimeoutMs) {
            this.state = 'HALF_OPEN';
        }
    }

    private getRetryAfterMs(): number {
        if (this.openedAt === undefined) {
            return this.recoveryTimeoutMs;
        }

        const elapsedMs = Date.now() - this.openedAt;
        return Math.max(this.recoveryTimeoutMs - elapsedMs, 0);
    }
}
