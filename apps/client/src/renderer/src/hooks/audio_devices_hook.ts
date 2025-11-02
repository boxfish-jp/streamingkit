import { useEffect, useState } from "react";
import type { AudioDevice } from "../lib/types";

const getAudioDevices = async (): Promise<AudioDevice[]> => {
	try {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices
			.filter((device) => device.kind === "audiooutput")
			.map((device) => ({
				deviceId: device.deviceId,
				label: device.label || `出力デバイス (${device.deviceId})`,
				kind: device.kind,
			}));
	} catch (error) {
		console.error("オーディオデバイスの取得に失敗しました:", error);
		return [];
	}
};

export const useAudioDevices = () => {
	const [_deviceLists, _setDeviceLists] = useState<AudioDevice[]>([]);

	useEffect(() => {
		getAudioDevices().then((lists) => {
			_setDeviceLists(lists);
		});
	});

	return _deviceLists;
};
