import type { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      onAudio: (
        callback: (value: {
          id: number;
          channel: number;
          audio: Uint8Array;
        }) => Promise<void>,
      ) => () => void;
      onFinish: (id: number, message: string) => void;
    };
  }
}
