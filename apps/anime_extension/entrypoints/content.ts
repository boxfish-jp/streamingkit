import type { AnimeInfoMessage } from "kit_models";
import {
  SCRIPT_SETTINGS_KEY,
  type ScriptSetting,
} from "~/models/script_setting";

const SITE_NAME = "u-next";
const CHECK_INTERVAL = 100;

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastTitle = "";
let lastEpisode = "";
let lastProgress = -1;

const extractAnimeInfo = (): Omit<AnimeInfoMessage, "type"> | null => {
  const h2 = document.querySelector("h2");
  const h3 = document.querySelector("h3");
  const video = document.querySelector<HTMLVideoElement>("video");

  if (!h2 || !h3 || !video) return null;

  const title = h2.textContent?.trim() ?? "";
  const episode = h3.textContent?.trim() ?? "";
  const progress = Math.floor(video.currentTime);
  const duration = video.duration;

  if (!title || !episode || Number.isNaN(duration)) return null;

  return { title, episode, progress, duration };
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
  const settingsResult = await chrome.storage.local.get(SCRIPT_SETTINGS_KEY);
  const settings =
    (settingsResult[SCRIPT_SETTINGS_KEY] as ScriptSetting[]) ?? [];

  if (settings.find((s) => s.name === SITE_NAME)?.enabled) {
    startWatching();
  } else {
    stopWatching();
  }
};

export default defineContentScript({
  matches: ["*://video.unext.jp/play/*"],
  async main() {
    chrome.storage.onChanged.addListener(async (_, area) => {
      if (area !== "local") return;
      await syncState();
    });
    await syncState();
  },
});
