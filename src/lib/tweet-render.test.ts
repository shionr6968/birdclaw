import { describe, expect, it } from "vitest";
import { renderTweetMarkdown, renderTweetPlainText } from "./tweet-render";

describe("tweet render helpers", () => {
	it("renders plain text with expanded urls", () => {
		expect(
			renderTweetPlainText("Hi @sam https://t.co/demo #ship", {
				mentions: [
					{
						username: "sam",
						start: 3,
						end: 7,
					},
				],
				urls: [
					{
						url: "https://t.co/demo",
						expandedUrl: "https://example.com/demo",
						displayUrl: "example.com/demo",
						start: 8,
						end: 25,
					},
				],
				hashtags: [
					{
						tag: "ship",
						start: 26,
						end: 31,
					},
				],
			}),
		).toBe("Hi @sam https://example.com/demo #ship");
	});

	it("renders markdown with mention and url links", () => {
		expect(
			renderTweetMarkdown("Hi @sam https://t.co/demo", {
				mentions: [
					{
						username: "sam",
						start: 3,
						end: 7,
						profile: {
							id: "profile_1",
							handle: "sam",
							displayName: "Sam Altman",
							bio: "",
							followersCount: 1,
							avatarHue: 1,
							createdAt: "2026-03-09T00:00:00.000Z",
						},
					},
				],
				urls: [
					{
						url: "https://t.co/demo",
						expandedUrl: "https://example.com/demo",
						displayUrl: "example.com/demo",
						start: 8,
						end: 25,
					},
				],
			}),
		).toBe(
			"Hi [@sam](https://x.com/sam) [example\\.com/demo](https://example.com/demo)",
		);
	});
});
