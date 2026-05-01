const ONE_MINUTE_MS = 60_000;
const DEFAULT_MAX_MESSAGES = 80;

export class RateLimiter {
    private readonly timestamps: number[] = [];

    constructor(
        private readonly maxMessages = DEFAULT_MAX_MESSAGES,
        private readonly windowMs = ONE_MINUTE_MS
    ) {}

    checkLimit(): boolean {
        const now = Date.now();
        this.prune(now);

        if (this.timestamps.length >= this.maxMessages) {
            return false;
        }

        this.timestamps.push(now);
        return true;
    }

    async waitForSlot(): Promise<void> {
        while (!this.checkLimit()) {
            const waitMs = this.getWaitTimeMs();
            await sleep(waitMs);
        }
    }

    private prune(now: number): void {
        while (this.timestamps.length > 0 && now - this.timestamps[0] >= this.windowMs) {
            this.timestamps.shift();
        }
    }

    private getWaitTimeMs(now = Date.now()): number {
        this.prune(now);

        if (this.timestamps.length < this.maxMessages) {
            return 0;
        }

        const oldestTimestamp = this.timestamps[0];
        return Math.max(this.windowMs - (now - oldestTimestamp), 1);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
