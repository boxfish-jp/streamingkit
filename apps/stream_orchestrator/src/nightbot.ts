import { OauthClient } from "oauth_client";
import type { TokenStore } from "token_store";

export class NightbotClient extends OauthClient {
  constructor(clientId: string, clientSecret: string, tokenStore: TokenStore) {
    super({
      tokenStore,
      provider: "nightbot",
      authConfig: {
        authorizeEndpoint: "https://api.nightbot.tv/oauth2/authorize",
        tokenEndpoint: "https://api.nightbot.tv/oauth2/token",
        scopes: ["channel_send"],
        callbackPort: 5000,
      },
      clientId,
      clientSecret,
      errorStatus: "serverFailedToGetNightbotToken",
    });
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
