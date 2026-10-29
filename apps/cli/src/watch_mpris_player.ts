import { type ClientInterface, type MessageBus, sessionBus } from "dbus-next";
import { EventEmitter } from "event_emitter";
import type { MediaInfoMessage } from "kit_models";
import {
  buildMusicMediaInfo,
  type MprisProperties,
  toMprisProperties,
  toNumberOrZero,
  toStringOrEmpty,
} from "./mpris_media_info.js";

const PLAYER_INTERFACE = "org.mpris.MediaPlayer2.Player";
const PROPERTIES_INTERFACE = "org.freedesktop.DBus.Properties";
const DBUS_NAME = "org.freedesktop.DBus";
const DBUS_PATH = "/org/freedesktop/DBus";
const PLAYER_PATH = "/org/mpris/MediaPlayer2";

interface WatchMprisPlayerEvent {
  onChange: [message: MediaInfoMessage];
}

const mediaInfoKey = (message: MediaInfoMessage) =>
  [
    message.uri,
    message.playbackStatus,
    message.title,
    message.artist,
    message.album,
    message.artworkUrl,
    message.progress,
    message.duration,
  ].join("\u0000");

export class WatchMprisPlayer extends EventEmitter<WatchMprisPlayerEvent> {
  private _playerName: string;
  private _bus: MessageBus | null = null;
  private _properties: ClientInterface | null = null;
  private _lastMessage: MediaInfoMessage | null = null;
  private _disposed = false;

  constructor(playerName = "spotify") {
    super();
    this._playerName = `org.mpris.MediaPlayer2.${playerName}`;
    void this._init();
  }

  dispose() {
    this._disposed = true;
    this._detachProperties();
    this._bus?.disconnect();
    this._bus = null;
  }

  private _detachProperties = () => {
    this._properties?.removeListener(
      "PropertiesChanged",
      this._onPropertiesChanged,
    );
    this._properties = null;
  };

  private _init = async () => {
    let bus: MessageBus;
    try {
      bus = sessionBus();
    } catch (error) {
      console.error("MPRIS: セッションバスに接続できませんでした", error);
      return;
    }
    if (this._disposed) {
      bus.disconnect();
      return;
    }
    this._bus = bus;
    bus.on("error", (error: unknown) => {
      console.error("MPRIS: バスエラー", error);
    });
    try {
      const dbusObject = await bus.getProxyObject(DBUS_NAME, DBUS_PATH);
      if (this._disposed) {
        bus.disconnect();
        return;
      }
      const dbusInterface = dbusObject.getInterface(DBUS_NAME);
      dbusInterface.on(
        "NameOwnerChanged",
        async (name: string, _oldOwner: string, newOwner: string) => {
          if (this._disposed || name !== this._playerName) return;
          if (newOwner) {
            await this._attach();
            return;
          }
          this._onPlayerGone();
        },
      );
      const owned: boolean = await dbusInterface.NameHasOwner(this._playerName);
      if (owned) await this._attach();
    } catch (error) {
      console.error("MPRIS: 監視を開始できませんでした", error);
      this._bus?.disconnect();
      this._bus = null;
    }
  };

  private _attach = async () => {
    if (!this._bus || this._disposed) return;
    try {
      const player = await this._bus.getProxyObject(
        this._playerName,
        PLAYER_PATH,
      );
      if (this._disposed) return;
      this._detachProperties();
      const properties = player.getInterface(PROPERTIES_INTERFACE);
      this._properties = properties;
      properties.on("PropertiesChanged", this._onPropertiesChanged);
      await this._emitCurrentState();
    } catch (error) {
      console.error(`MPRIS: ${this._playerName} の取得に失敗しました`, error);
      this._properties = null;
    }
  };

  private _onPropertiesChanged = (
    _interfaceName: string,
    changed: MprisProperties,
  ) => {
    if (!("Metadata" in changed) && !("PlaybackStatus" in changed)) return;
    void this._emitCurrentState().catch((error) => {
      console.error("MPRIS: 再生状態の取得に失敗しました", error);
    });
  };

  private _emitCurrentState = async () => {
    const properties = this._properties;
    if (!properties || this._disposed) return;
    const all = (await properties.GetAll(PLAYER_INTERFACE)) as MprisProperties;
    const metadata = toMprisProperties(all.Metadata);
    const positionUs = toNumberOrZero(
      await properties.Get(PLAYER_INTERFACE, "Position"),
    );
    this._emitIfChanged(
      buildMusicMediaInfo(
        metadata,
        toStringOrEmpty(all.PlaybackStatus),
        positionUs,
      ),
    );
  };

  private _onPlayerGone = () => {
    const last = this._lastMessage;
    this._detachProperties();
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
    if (this._disposed) return;
    if (
      this._lastMessage &&
      mediaInfoKey(this._lastMessage) === mediaInfoKey(message)
    )
      return;
    this._lastMessage = message;
    this.emit("onChange", message);
  };
}
