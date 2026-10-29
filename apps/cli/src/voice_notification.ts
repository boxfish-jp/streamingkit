import type { InstSyntesizeMessage } from "kit_models";

const VOICE_NOTIFICATION_CHANNEL = 4;

type EmitVoiceMessage = (message: InstSyntesizeMessage) => void;

export class VoiceNotifier {
  private _emit: EmitVoiceMessage;

  constructor(emit: EmitVoiceMessage) {
    this._emit = emit;
  }

  speak = (content: string) => {
    this._emit({
      type: "instSynthesize",
      content,
      channel: VOICE_NOTIFICATION_CHANNEL,
    });
  };

  warn = (text: string) => {
    console.warn(text);
    try {
      this.speak(text);
    } catch (error) {
      console.error("音声通知に失敗しました", error);
    }
  };
}
