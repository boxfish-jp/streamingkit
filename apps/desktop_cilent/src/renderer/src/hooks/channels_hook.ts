import { useState } from "react";
import { type Channel, ChannelsManager } from "../channels";

export const useChannels = () => {
	const [items, setChannels] = useState<Channel[]>(() =>
		ChannelsManager.instance().getItems(),
	);

	const updateChannels = (
		deviceId: string,
		channel: number,
		volume: number,
		isMute: boolean,
	) => {
		const index = items.findIndex((v) => v.channel === channel);
		const newChannels = [...items];
		if (index !== -1) {
			newChannels[index] = { deviceId, volume, channel, isMute };
		}
		return newChannels;
	};

	const handleValueChange = (
		deviceId: string,
		channel: number,
		volume: number,
		isMute: boolean,
	) => {
		const newChannels = updateChannels(deviceId, channel, volume, isMute);
		setChannels(newChannels);
	};

	const handleValueCommit = (
		deviceId: string,
		channel: number,
		volume: number,
		isMute: boolean,
	) => {
		const newChannels = updateChannels(deviceId, channel, volume, isMute);
		ChannelsManager.instance().set(newChannels);
		setChannels(newChannels);
	};

	const onReset = () => {
		const newChannels = Array(5)
			.fill(null)
			.map((_, index) => ({
				deviceId: "default",
				volume: 50,
				channel: index,
				isMute: false,
			}));
		ChannelsManager.instance().set(newChannels);
		setChannels(newChannels);
	};

	return { items, handleValueChange, handleValueCommit, onReset } as const;
};
