import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OauthClient } from "oauth_client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class NightbotClient extends OauthClient {
  constructor(clientId: string, clientSecret: string, refreshToken: string) {
    const body = new URLSearchParams();
    body.append("grant_type", "refresh_token");
    body.append("refresh_token", refreshToken);
    const envFilePath = join(__dirname, "../../../.env");
    console.log(`Loading environment variables from: ${envFilePath}`);

    super({
      endpoint: "https://api.nightbot.tv/oauth2/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`,
        ).toString("base64")}`,
      },
      saveSetting: {
        prefix: "NIGHTBOT",
        envFilePath: envFilePath,
      },
      initialRefreshToken: refreshToken,
      body,
      errorStatus: "serverFailedToGetSpotifyToken",
    });
  }

  getAccessToken(): string | null {
    return this._accessToken;
  }

  isTokenValid(): boolean {
    return this._accessToken !== null && this._refreshToken !== null;
  }

  async sendComment(message: string) {
    const url = `https://api.nightbot.tv/1/channel/send`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...this.headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ message }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to send YouTube Comment. Status: ${response.status}, Response: ${errorText}`,
        );
      }
      return;
    } catch (error) {
      console.error("Error fetching Nightbot channel ID:", error);
    }
  }
}
