import { IImage } from "@/types/editor";
import { BaseSequence, SequenceItemOptions } from "../base-sequence";
import { calculateMediaStyles } from "../styles";
import { calculateFrames } from "../../utils/frames";
import { Img } from "remotion";

export default function Image({
	item,
	options,
}: {
	item: IImage;
	options: SequenceItemOptions;
}) {
	const { fps } = options;
	const { details } = item;
	const crop = details?.crop || {
		x: 0,
		y: 0,
		width: details.width,
		height: details.height,
	};
	calculateFrames(item.display, fps);

	const children = (
		<div style={calculateMediaStyles(details, crop)}>
			{/* image layer */}
			<Img
				data-id={item.id}
				src={details.src}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "fill",
					pointerEvents: "none",
				}}
			/>
		</div>
	);

	return BaseSequence({ item, options, children });
}
