import {
  type ClientInterface,
  type MessageBus,
  sessionBus,
  Variant,
} from "dbus-next";
import { EventEmitter } from "event_emitter";
import type { MediaInfoMessage } from "kit_models";

const PLAYER_INTERFACE = "org.mpris.MediaPlayer2.Player";
const PROPERTIES_INTERFACE = "org.freedesktop.DBus.Properties";
const DBUS_NAME = "org.freedesktop.DBus";
const DBUS_PATH = "/org/freedesktop/DBus";
const PLAYER_PATH = "/org/mpris/MediaPlayer2";
const MICROS_PER_SECOND = 1_000_000;

interface MprisProperties {
  [property: string]: unknown;
}

interface WatchSpotifyEvent {
  onChange: [message: MediaInfoMessage];
}

const unwrap = (value: unknown): unknown => {
  if (value instanceof Variant) return value.value;
  if (
    value !== null &&
    typeof value === "object" &&
    "signature" in value &&
    "value" in value
  )
    return (value as { value: unknown }).value;
  return value;
};

const asString = (value: unknown): string => {
  const unwrapped = unwrap(value);
  return typeof unwrapped === "string" ? unwrapped : "";
};

const asNumber = (value: unknown): number => {
  const unwrapped = unwrap(value);
  return typeof unwrapped === "bigint" || typeof unwrapped === "number"
    ? Number(unwrapped)
    : 0;
};

const asStringArray = (value: unknown): string[] => {
  const unwrapped = unwrap(value);
  return Array.isArray(unwrapped) ? unwrapped.map(String) : [];
};

const toPlaybackStatus = (
  status: string,
): MediaInfoMessage["playbackStatus"] => {
  if (status === "Playing" || status === "Paused") return status;
  return "Stopped";
};

export const buildMediaInfo = (
  metadata: MprisProperties,
  playbackStatus: string,
  positionUs: number | bigint,
): MediaInfoMessage => ({
  type: "mediaInfo",
  kind: "music",
  title: asString(metadata["xesam:title"]),
  episode: "",
  progress: Math.floor(Number(positionUs) / MICROS_PER_SECOND),
  duration: Math.floor(asNumber(metadata["mpris:length"]) / MICROS_PER_SECOND),
  artist: asStringArray(metadata["xesam:artist"]).join(", "),
  album: asString(metadata["xesam:album"]),
  artworkUrl: asString(metadata["mpris:artUrl"]),
  uri: asString(metadata["xesam:url"]) || asString(metadata["mpris:trackid"]),
  playbackStatus: toPlaybackStatus(playbackStatus),
});

export class WatchSpotify extends EventEmitter<WatchSpotifyEvent> {
  private _playerName: string;
  private _bus: MessageBus | null = null;
  private _properties: ClientInterface | null = null;
  private _lastMessage: MediaInfoMessage | null = null;

  constructor(playerName = "spotify") {
    super();
    this._playerName = `org.mpris.MediaPlayer2.${playerName}`;
    this._init();
  }

  private _init = async () => {
    let bus: MessageBus;
    try {
      bus = sessionBus();
    } catch (e) {
      console.error("MPRIS: セッションバスに接続できませんでした", e);
      return;
    }
    this._bus = bus;
    bus.on("error", (err: unknown) => {
      console.error("MPRIS: バスエラー", err);
    });
    try {
      const dbusObject = await bus.getProxyObject(DBUS_NAME, DBUS_PATH);
      const dbusInterface = dbusObject.getInterface(DBUS_NAME);
      dbusInterface.on(
        "NameOwnerChanged",
        async (name: string, _oldOwner: string, newOwner: string) => {
          if (name !== this._playerName) return;
          if (newOwner) {
            await this._attach();
          } else {
            this._onPlayerGone();
          }
        },
      );
      const owned: boolean = await dbusInterface.NameHasOwner(this._playerName);
      if (owned) {
        await this._attach();
      }
    } catch (e) {
      console.error("MPRIS: 監視を開始できませんでした", e);
    }
  };

  private _attach = async () => {
    if (!this._bus) return;
    try {
      const player = await this._bus.getProxyObject(
        this._playerName,
        PLAYER_PATH,
      );
      this._properties = player.getInterface(PROPERTIES_INTERFACE);
      this._properties.on("PropertiesChanged", this._onPropertiesChanged);
      await this._emitCurrentState();
    } catch (e) {
      console.error(`MPRIS: ${this._playerName} の取得に失敗しました`, e);
      this._properties = null;
    }
  };

  private _onPropertiesChanged = async (
    _interfaceName: string,
    changed: MprisProperties,
  ) => {
    if (!("Metadata" in changed) && !("PlaybackStatus" in changed)) return;
    await this._emitCurrentState();
  };

  private _emitCurrentState = async () => {
    const properties = this._properties;
    if (!properties) return;
    const all = (await properties.GetAll(PLAYER_INTERFACE)) as MprisProperties;
    const metadata = (unwrap(all.Metadata) ?? {}) as MprisProperties;
    const positionUs = asNumber(
      await properties.Get(PLAYER_INTERFACE, "Position"),
    );
    this._emitIfChanged(
      buildMediaInfo(metadata, asString(all.PlaybackStatus), positionUs),
    );
  };

  private _onPlayerGone = () => {
    const last = this._lastMessage;
    this._properties = null;
    if (!last?.title) return;
    this._emitIfChanged({
      ...last,
      title: "",
      artist: "",
      album: "",
      artworkUrl: "",
      uri: "",
      progress: 0,
      duration: 0,
      playbackStatus: "Stopped",
    });
  };

  private _emitIfChanged = (message: MediaInfoMessage) => {
    const key = `${message.uri}\u0000${message.playbackStatus}`;
    const lastKey = `${this._lastMessage?.uri ?? ""}\u0000${this._lastMessage?.playbackStatus ?? ""}`;
    if (this._lastMessage && key === lastKey) return;
    this._lastMessage = message;
    this.emit("onChange", message);
  };
}
