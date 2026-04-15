import { NightbotClient } from "../src/nightbot";

const clientId = process.env.NIGHTBOT_CLIENT_ID;
const clientSecret = process.env.NIGHTBOT_CLIENT_SECRET;
const refreshToken = process.env.NIGHTBOT_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  throw new Error("Missing Nightbot credentials in environment variables.");
}

async function authenticateNightbot() {
  const nightbot = new NightbotClient(clientId, clientSecret, refreshToken);
  nightbot.on("onMessage", (message) => {
    console.log("Nightbot message:", message);
  });
  nightbot.start();
  await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for token refresh to complete

  // Assuming OauthClient has a method to refresh token or similar
  try {
    const accessToken = nightbot.getAccessToken();
    if (accessToken) {
    } else {
      console.error("Failed to obtain Nightbot access token.");
    }
  } catch (err) {
    console.error("Nightbot authentication failed:", err);
  }
}

authenticateNightbot();
