import type { ObsConnection } from "./obs_connection.js";

interface ObsSpecialInputs {
  desktop: string | null;
  mic: string | null;
}

interface ObsInputHints {
  desktop: string;
  mic: string;
}

export interface ObsAudioInputsOptions {
  desktopInputName?: string;
  micInputName?: string;
  desktopInputHint?: string;
  micInputHint?: string;
}

export class ObsAudioInputs {
  private _connection: ObsConnection;
  private _desktopInputName: string | null;
  private _micInputName: string | null;
  private _inputHints: ObsInputHints;
  private _specialInputsPromise: Promise<ObsSpecialInputs | null> | null = null;

  constructor(connection: ObsConnection, options: ObsAudioInputsOptions = {}) {
    this._connection = connection;
    this._desktopInputName = options.desktopInputName?.trim() || null;
    this._micInputName = options.micInputName?.trim() || null;
    this._inputHints = {
      desktop: options.desktopInputHint ?? "",
      mic: options.micInputHint ?? "",
    };
  }

  get desktopInputName(): string | null {
    return this._desktopInputName;
  }

  get micInputName(): string | null {
    return this._micInputName;
  }

  async resolveDesktop(): Promise<void> {
    if (this._desktopInputName) return;
    const inputs = await this._getSpecialInputs();
    if (!inputs || this._desktopInputName) return;
    this._desktopInputName = inputs.desktop;
    if (this._desktopInputName) {
      console.log(
        `OBS: デスクトップ音声 "${this._desktopInputName}" を使用します`,
      );
      return;
    }
    this._specialInputsPromise = null;
    console.error(
      `OBS: デスクトップ音声が見つかりません。${this._inputHints.desktop}`,
    );
  }

  async resolveMic(): Promise<void> {
    if (this._micInputName) return;
    const inputs = await this._getSpecialInputs();
    if (!inputs || this._micInputName) return;
    this._micInputName = inputs.mic;
    if (this._micInputName) {
      console.log(`OBS: マイク音声 "${this._micInputName}" を使用します`);
      return;
    }
    this._specialInputsPromise = null;
    console.error(`OBS: マイク音声が見つかりません。${this._inputHints.mic}`);
  }

  private _getSpecialInputs = (): Promise<ObsSpecialInputs | null> => {
    this._specialInputsPromise ??= this._fetchSpecialInputs().then((inputs) => {
      if (!inputs) this._specialInputsPromise = null;
      return inputs;
    });
    return this._specialInputsPromise;
  };

  private _fetchSpecialInputs = async (): Promise<ObsSpecialInputs | null> => {
    try {
      const { desktop1, desktop2, mic1, mic2, mic3, mic4 } =
        await this._connection.call("GetSpecialInputs");
      return {
        desktop: desktop1 || desktop2 || null,
        mic: mic1 || mic2 || mic3 || mic4 || null,
      };
    } catch (error) {
      console.error("OBS: 音声ソースの取得に失敗しました", error);
      return null;
    }
  };
}
