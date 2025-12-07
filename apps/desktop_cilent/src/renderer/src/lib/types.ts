export interface AudioSetting {
	deviceId: string;
	volume: number;
	channel: number;
	isMute: boolean;
}

export interface AudioModule {
	audioContext: AudioContext;
	gainNode: GainNode;
}

export interface AudioDevice {
	deviceId: string;
	label: string;
	kind: MediaDeviceKind;
}
