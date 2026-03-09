import type {
	TweetEntities,
	TweetHashtagEntity,
	TweetMentionEntity,
	TweetUrlEntity,
} from "./types";

type TweetSegment =
	| ({ kind: "mention" } & TweetMentionEntity)
	| ({ kind: "url" } & TweetUrlEntity)
	| ({ kind: "hashtag" } & TweetHashtagEntity);

const MARKDOWN_ESCAPE_CHARACTERS = new Set([
	"\\",
	"`",
	"*",
	"_",
	"{",
	"}",
	"[",
	"]",
	"(",
	")",
	"#",
	"+",
	".",
	"!",
	"|",
	">",
	"-",
]);

function escapeMarkdown(text: string) {
	return [...text]
		.map((character) =>
			MARKDOWN_ESCAPE_CHARACTERS.has(character) ? `\\${character}` : character,
		)
		.join("");
}

export function collectTweetSegments(entities: TweetEntities): TweetSegment[] {
	return [
		...(entities.mentions?.map((entry) => ({
			...entry,
			kind: "mention" as const,
		})) ?? []),
		...(entities.urls?.map((entry) => ({ ...entry, kind: "url" as const })) ??
			[]),
		...(entities.hashtags?.map((entry) => ({
			...entry,
			kind: "hashtag" as const,
		})) ?? []),
	].sort((left, right) => left.start - right.start);
}

function renderTweetText(
	text: string,
	entities: TweetEntities,
	renderSegment: (segment: TweetSegment, fallback: string) => string,
) {
	const segments = collectTweetSegments(entities);
	let cursor = 0;
	let output = "";

	for (const segment of segments) {
		if (
			segment.start < cursor ||
			segment.end <= segment.start ||
			segment.end > text.length
		) {
			continue;
		}

		output += text.slice(cursor, segment.start);
		const fallback = text.slice(segment.start, segment.end);
		output += renderSegment(segment, fallback);
		cursor = segment.end;
	}

	output += text.slice(cursor);
	return output;
}

export function renderTweetPlainText(text: string, entities: TweetEntities) {
	return renderTweetText(text, entities, (segment, fallback) => {
		if (segment.kind === "url") {
			return segment.expandedUrl;
		}
		if (segment.kind === "mention") {
			return `@${segment.username}`;
		}
		if (segment.kind === "hashtag") {
			return `#${segment.tag}`;
		}
		return fallback;
	});
}

export function renderTweetMarkdown(text: string, entities: TweetEntities) {
	return renderTweetText(text, entities, (segment, fallback) => {
		if (segment.kind === "url") {
			return `[${escapeMarkdown(segment.displayUrl)}](${segment.expandedUrl})`;
		}
		if (segment.kind === "mention") {
			const label = `@${segment.username}`;
			return segment.profile
				? `[${escapeMarkdown(label)}](https://x.com/${segment.username})`
				: escapeMarkdown(label);
		}
		if (segment.kind === "hashtag") {
			return escapeMarkdown(`#${segment.tag}`);
		}
		return escapeMarkdown(fallback);
	});
}
