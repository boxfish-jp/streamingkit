export interface Channel {
	deviceId: string;
	volume: number;
	channel: number;
	isMute: boolean;
}

const readChannels = (): Channel[] => {
	const localStorageItems = localStorage.getItem("audioSettings");
	return localStorageItems
		? (JSON.parse(localStorageItems) as Channel[])
		: Array(5)
				.fill(null)
				.map((_, index) => ({
					deviceId: "default",
					volume: 50,
					channel: index,
					isMute: false,
				}));
};

const saveChannels = (channels: Channel[]) => {
	localStorage.setItem("audioSettings", JSON.stringify(channels));
};

export class ChannelsManager {
	private _channels: Channel[] = [];
	private static _instance: ChannelsManager;

	private constructor() {
		const newChannels = readChannels();
		this._channels = newChannels;
	}

	static instance() {
		this._instance ??= new ChannelsManager();
		return this._instance;
	}

	getItems() {
		return this._channels;
	}

	set(newChannels: Channel[]) {
		this._channels = newChannels;
		saveChannels(this._channels);
	}

	getVolume(channelId: number) {
		if (channelId < 0 || channelId >= this._channels.length) {
			throw new Error("Invalid channel number");
		}
		const ch = this._channels[channelId];
		return ch.isMute ? 0 : ch.volume;
	}

	getDeviceId(channelId: number) {
		if (channelId < 0 || channelId >= this._channels.length) {
			throw new Error("Invalid channel number");
		}
		const ch = this._channels[channelId];
		return ch.deviceId;
	}
}
