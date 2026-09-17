import { useEffect, useRef } from "react";
import Composition from "./composition";
import { Player as RemotionPlayer, PlayerRef } from "@remotion/player";
import useStore from "../store/use-store";

const Player = () => {
	const playerRef = useRef<PlayerRef>(null);
	const { setPlayerRef, duration, fps, size, background } = useStore();

	useEffect(() => {
		if (playerRef.current) {
			const originalSeekTo = playerRef.current.seekTo.bind(playerRef.current);
			playerRef.current.seekTo = (frame: number) => {
				if (typeof frame !== "number" || !Number.isFinite(frame)) {
					console.warn("Ignored non-finite seekTo frame:", frame);
					return;
				}
				return originalSeekTo(Math.max(0, Math.round(frame)));
			};
		}
		setPlayerRef(playerRef as React.RefObject<PlayerRef>);
	}, []);

	return (
		<RemotionPlayer
			ref={playerRef}
			component={Composition}
			durationInFrames={Math.round((duration / 1000) * fps) || 1}
			compositionWidth={size.width}
			compositionHeight={size.height}
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: size.width,
				height: size.height
			}}
			fps={30}
			overflowVisible
			browserMediaControlsBehavior={{ mode: "do-nothing" }}
		/>
	);
};
export default Player;
