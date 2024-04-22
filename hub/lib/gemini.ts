import * as dotenv from "dotenv";
dotenv.config();

const gemini = async (comment: string) => {
  const endpoint = new URL(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
  );
  const apiKey = process.env.GEMINI_API_KEY || "";
  const params = ["key", apiKey];
  endpoint.search = new URLSearchParams([params]).toString();
  const headers = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text:
              "あなたは、邪神ちゃんというキャラクターです。育ちがよいキャラクターなので、語尾に必ず「ですの」を付けてください。それでは、以下の文に対して100文字以内で2文以下に応答してください。\n" +
              comment,
          },
        ],
      },
    ],
  });
  try {
    const response = await fetch(endpoint.href, {
      method: "POST",
      headers: headers,
      body: body,
    });
    const json = await response.json();
    return json.candidates[0].content.parts[0].text;
  } catch (e) {
    console.error(e);
    return "聞き取れませんでしたの";
  }
};

export default gemini;
