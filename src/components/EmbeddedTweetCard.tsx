import { formatShortTimestamp } from "#/lib/present";
import type { EmbeddedTweet } from "#/lib/types";
import {
	embeddedTweetAuthorClass,
	embeddedTweetCardClass,
	embeddedTweetCopyClass,
	embeddedTweetHeaderClass,
	embeddedTweetLabelClass,
	timestampClass,
} from "#/lib/ui";
import { ProfilePreview } from "./ProfilePreview";
import { TweetMediaGrid } from "./TweetMediaGrid";
import { TweetRichText } from "./TweetRichText";

export function EmbeddedTweetCard({
	item,
	label,
}: {
	item: EmbeddedTweet;
	label: string;
}) {
	return (
		<section className={embeddedTweetCardClass}>
			<p className={embeddedTweetLabelClass}>{label}</p>
			<header className={embeddedTweetHeaderClass}>
				<ProfilePreview profile={item.author}>
					<span className={embeddedTweetAuthorClass}>
						<strong>{item.author.displayName}</strong>
						<span>@{item.author.handle}</span>
					</span>
				</ProfilePreview>
				<span className={timestampClass}>
					{formatShortTimestamp(item.createdAt)}
				</span>
			</header>
			<TweetRichText
				className={embeddedTweetCopyClass}
				entities={item.entities}
				text={item.text}
			/>
			<TweetMediaGrid items={item.media} />
		</section>
	);
}
