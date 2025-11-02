import { Button } from "./components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./components/ui/select";
import { Slider } from "./components/ui/slider";
import { useAudioDevices } from "./hooks/audio_devices_hook";
import { useChannels } from "./hooks/channels_hook";

function App(): JSX.Element {
	const channels = useChannels();
	const audioDevices = useAudioDevices();

	return (
		<div className="h-screen w-full flex flex-col gap-4 py-5 items-center">
			<div
				className="h-screen w-full grid grid-cols-6
        items-center justify-center gap-5"
			>
				{channels.items.map((v) => (
					<div
						key={v.channel}
						className="col-start-2 col-span-4 grid grid-cols-6 items-center justify-center gap-2"
					>
						<div className="text-xl col-span-1">Ch {v.channel}</div>
						<div className="text-2xl col-start-3 mx-auto">
							{v.isMute ? 0 : v.volume}
						</div>
						<Button
							className="col-start-6 ms-auto"
							onClick={() => {
								channels.handleValueCommit(
									v.deviceId,
									v.channel,
									v.volume,
									!v.isMute,
								);
							}}
						>
							{v.isMute ? "Unmute" : "Mute"}
						</Button>

						{/* デバイス選択用のセレクトボックス */}
						<div className="col-span-6 mb-2">
							<Select
								value={v.deviceId}
								onValueChange={(value) =>
									channels.handleValueCommit(
										value,
										v.channel,
										v.volume,
										v.isMute,
									)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="出力デバイスを選択" />
								</SelectTrigger>
								<SelectContent>
									{audioDevices.map((device) => (
										<SelectItem key={device.deviceId} value={device.deviceId}>
											{device.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<Slider
							className="col-span-6"
							defaultValue={[v.volume]}
							value={v.isMute ? [0] : [v.volume]}
							disabled={v.isMute}
							max={200}
							step={1}
							onValueChange={(value: number[]) => {
								channels.handleValueChange(
									v.deviceId,
									v.channel,
									value[0],
									v.isMute,
								);
							}}
							onValueCommit={(value: number[]) => {
								channels.handleValueCommit(
									v.deviceId,
									v.channel,
									value[0],
									v.isMute,
								);
							}}
						/>
					</div>
				))}
			</div>
			<Button className="w-fit" onClick={channels.onReset}>
				Reset
			</Button>
		</div>
	);
}

export default App;
