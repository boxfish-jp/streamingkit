import type { AnimeInfoMessage } from "kit_models";
import {
  SCRIPT_SETTINGS_KEY,
  type ScriptSetting,
} from "~/models/script_setting";

const CHECK_INTERVAL = 100;

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastTitle = "";
let lastEpisode = "";
let lastProgress = -1;
let hasSyncedOnce = false;

const SITE_NAME = (() => {
  const hostname = window.location.hostname;
  if (hostname === "video.unext.jp") return "u-next";
  if (hostname === "www.youtube.com") return "youtube";
  if (hostname === "www.nicovideo.jp") return "nicovideo";
  return null;
})();

const extractAnimeInfo = (): Omit<AnimeInfoMessage, "type"> | null => {
  const video = document.querySelector<HTMLVideoElement>("video");
  if (!video) return null;

  if (SITE_NAME === "u-next") {
    const h2 = document.querySelector("h2");
    const h3 = document.querySelector("h3");
    if (!h2 || !h3) return null;
    const title = h2.textContent?.trim() ?? "";
    const episode = h3.textContent?.trim() ?? "";
    const progress = Math.floor(video.currentTime);
    const duration = video.duration;
    if (!title || Number.isNaN(duration)) return null;
    return { title, episode, progress, duration };
  }

  if (SITE_NAME === "youtube") {
    const title = document.title.replace(/ - YouTube$/, "");
    const progress = Math.floor(video.currentTime);
    const duration = video.duration;
    if (!title || Number.isNaN(duration)) return null;
    return { title, episode: "", progress, duration };
  }

  if (SITE_NAME === "nicovideo") {
    const title = document.title.replace(/ - ニコニコ動画$/, "");
    const progress = Math.floor(video.currentTime);
    const duration = video.duration;
    if (!title || Number.isNaN(duration)) return null;
    return { title, episode: "", progress, duration };
  }

  return null;
};

const hasChanged = (info: Omit<AnimeInfoMessage, "type">): boolean =>
  info.title !== lastTitle ||
  info.episode !== lastEpisode ||
  Math.abs(info.progress - lastProgress) > 0;

const startWatching = () => {
  if (intervalId !== null) return;

  intervalId = setInterval(() => {
    const info = extractAnimeInfo();
    if (!info || !hasChanged(info)) return;

    lastTitle = info.title;
    lastEpisode = info.episode;
    lastProgress = info.progress;

    chrome.runtime.sendMessage({
      type: "animeInfo",
      ...info,
    } as AnimeInfoMessage);
  }, CHECK_INTERVAL);
};

const stopWatching = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  lastTitle = "";
  lastEpisode = "";
  lastProgress = -1;
};

const syncState = async () => {
  if (!SITE_NAME) return;

  const settingsResult = await chrome.storage.local.get(SCRIPT_SETTINGS_KEY);
  const settings =
    (settingsResult[SCRIPT_SETTINGS_KEY] as ScriptSetting[]) ?? [];
  const setting = settings.find((s) => s.name === SITE_NAME);

  if (setting?.enabled) {
    if (hasSyncedOnce || !setting.defaultOff) {
      startWatching();
    } else {
      stopWatching();
    }
  } else {
    stopWatching();
  }

  hasSyncedOnce = true;
};

export default defineContentScript({
  matches: [
    "*://video.unext.jp/play/*",
    "*://www.youtube.com/watch*",
    "*://www.nicovideo.jp/watch/*",
  ],
  async main() {
    if (!SITE_NAME) return;
    chrome.storage.onChanged.addListener(async (_, area) => {
      if (area !== "local") return;
      await syncState();
    });
    await syncState();
  },
});
