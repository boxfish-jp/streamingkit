export class ServerPool {
  private _servers: { url: string; wasAlive: boolean }[];
  private _pingIntervalMs: number;
  private _pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(urls: string[], pingIntervalMs = 30000) {
    this._servers = urls.map((url) => ({ url, wasAlive: true }));
    this._pingIntervalMs = pingIntervalMs;
    this._startPing();
  }

  private _startPing(): void {
    this._pingTimer = setInterval(async () => {
      await Promise.all(
        this._servers.map(async (server) => {
          const isAlive = await this._ping(server.url);
          if (server.wasAlive !== isAlive) {
            console.log(
              `[ServerPool] ${server.url} → ${isAlive ? "alive" : "dead"}`,
            );
          }
          server.wasAlive = isAlive;
        }),
      );
    }, this._pingIntervalMs);
  }

  private async _ping(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${url}/version`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  stop(): void {
    if (this._pingTimer !== null) {
      clearInterval(this._pingTimer);
      this._pingTimer = null;
    }
  }

  getAliveServers(): string[] {
    return this._servers.filter((s) => s.wasAlive).map((s) => s.url);
  }

  markDead(url: string): void {
    const server = this._servers.find((s) => s.url === url);
    if (server) {
      server.wasAlive = false;
    }
  }
}
