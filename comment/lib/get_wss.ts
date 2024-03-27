import fetcher from "./fetcher";
import cheerio from "cheerio";

const getWss = async (liveId: string) => {
  const url = "https://live2.nicovideo.jp/watch/" + liveId;
  const streamPage = await fetcher(url);
  const $ = cheerio.load(streamPage);
  const embeddedData = $("#embedded-data").attr("data-props");
  if (!embeddedData) {
    throw new Error("Failed to get Embedded Data");
  }
  const embeddedDataJson = JSON.parse(embeddedData);
  const wss: string | undefined = embeddedDataJson.site.relive.webSocketUrl;
  return wss;
};

export default getWss;
