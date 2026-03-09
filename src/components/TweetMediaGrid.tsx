import type { TweetMediaItem } from "#/lib/types";
import { tweetMediaGridClass, tweetMediaTileClass } from "#/lib/ui";

export function TweetMediaGrid({ items }: { items: TweetMediaItem[] }) {
	if (items.length === 0) {
		return null;
	}

	return (
		<div className={tweetMediaGridClass(Math.min(items.length, 4))}>
			{items.slice(0, 4).map((item, index) => (
				<a
					key={item.url + String(index)}
					className={tweetMediaTileClass(index, Math.min(items.length, 4))}
					href={item.url}
					rel="noreferrer"
					target="_blank"
				>
					{item.type === "image" ? (
						<img
							alt={item.altText ?? `Tweet media ${String(index + 1)}`}
							className="tweet-media-image block size-full object-cover"
							loading="lazy"
							src={item.thumbnailUrl ?? item.url}
						/>
					) : (
						<span className="tweet-media-fallback grid min-h-40 place-items-center font-semibold text-[var(--ink-soft)]">
							{item.type === "video"
								? "Video"
								: item.type === "gif"
									? "GIF"
									: "Media"}
						</span>
					)}
				</a>
			))}
		</div>
	);
}
