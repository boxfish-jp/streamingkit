import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const api = {
	onAudio: (
		callback: (value: { channel: number; audio: ArrayBuffer }) => void,
	) => {
		const func = (
			_event,
			value: { id: number; channel: number; audio: ArrayBuffer },
		) => callback(value);
		ipcRenderer.on("audio", func);
		return () => {
			ipcRenderer.removeListener("audio", func);
		};
	},
	onFinish: (id: number, message: string) => {
		ipcRenderer.send("finish", id, message);
	},
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
	try {
		contextBridge.exposeInMainWorld("electron", electronAPI);
		contextBridge.exposeInMainWorld("api", api);
	} catch (error) {
		console.error(error);
	}
} else {
	// @ts-ignore (define in dts)
	window.electron = electronAPI;
	// @ts-ignore (define in dts)
	window.api = api;
}
