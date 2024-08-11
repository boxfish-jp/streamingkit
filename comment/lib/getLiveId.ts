import cheerio from "cheerio";

export const getLiveId = async (pageText: string) => {
  const $ = cheerio.load(pageText);
  const liveUrl = $('meta[property="og:url"]').attr("content");
  if (!liveUrl) {
    throw new Error("liveId not found");
  }
  const liveId = liveUrl.replace("https://live.nicovideo.jp/watch/", "");
  return liveId;
};
