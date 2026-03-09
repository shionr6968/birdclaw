import { listTimelineItems } from "./queries";
import { renderTweetMarkdown, renderTweetPlainText } from "./tweet-render";
import type { ReplyFilter, TimelineItem } from "./types";

export interface MentionExportItem {
	id: string;
	url: string;
	createdAt: string;
	accountId: string;
	accountHandle: string;
	isReplied: boolean;
	author: TimelineItem["author"];
	text: string;
	plainText: string;
	markdown: string;
	likeCount: number;
	mediaCount: number;
	bookmarked: boolean;
	liked: boolean;
	replyToTweetId?: string | null;
	quotedTweetId?: string | null;
}

export function exportMentionItems({
	account,
	search,
	replyFilter = "all",
	limit = 20,
}: {
	account?: string;
	search?: string;
	replyFilter?: ReplyFilter;
	limit?: number;
}) {
	const items = listTimelineItems({
		resource: "mentions",
		account,
		search,
		replyFilter,
		limit,
	});

	return items.map(
		(item): MentionExportItem => ({
			id: item.id,
			url: `https://x.com/${item.author.handle}/status/${item.id}`,
			createdAt: item.createdAt,
			accountId: item.accountId,
			accountHandle: item.accountHandle,
			isReplied: item.isReplied,
			author: item.author,
			text: item.text,
			plainText: renderTweetPlainText(item.text, item.entities),
			markdown: renderTweetMarkdown(item.text, item.entities),
			likeCount: item.likeCount,
			mediaCount: item.mediaCount,
			bookmarked: item.bookmarked,
			liked: item.liked,
			replyToTweetId: item.replyToTweet?.id ?? null,
			quotedTweetId: item.quotedTweet?.id ?? null,
		}),
	);
}
