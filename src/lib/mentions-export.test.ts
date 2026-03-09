// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const listTimelineItemsMock = vi.hoisted(() => vi.fn());

vi.mock("./queries", () => ({
	listTimelineItems: (...args: unknown[]) => listTimelineItemsMock(...args),
}));

describe("mention export", () => {
	it("builds mention export items with plain-text and markdown fields", async () => {
		listTimelineItemsMock.mockReturnValueOnce([
			{
				id: "tweet_1",
				accountId: "acct_primary",
				accountHandle: "@steipete",
				kind: "mentions",
				text: "Hi @sam https://t.co/demo",
				createdAt: "2026-03-09T00:00:00.000Z",
				isReplied: false,
				likeCount: 4,
				mediaCount: 0,
				bookmarked: false,
				liked: false,
				author: {
					id: "profile_1",
					handle: "sam",
					displayName: "Sam Altman",
					bio: "",
					followersCount: 1,
					avatarHue: 1,
					createdAt: "2026-03-09T00:00:00.000Z",
				},
				entities: {
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
				},
				media: [],
				replyToTweet: null,
				quotedTweet: {
					id: "tweet_q",
					text: "quoted",
					createdAt: "2026-03-09T00:00:00.000Z",
					author: {
						id: "profile_q",
						handle: "ava",
						displayName: "Ava",
						bio: "",
						followersCount: 1,
						avatarHue: 1,
						createdAt: "2026-03-09T00:00:00.000Z",
					},
					entities: {},
					media: [],
				},
			},
		]);
		const { exportMentionItems } = await import("./mentions-export");

		const result = exportMentionItems({
			search: "sam",
			replyFilter: "unreplied",
			limit: 5,
		});

		expect(listTimelineItemsMock).toHaveBeenCalledWith({
			resource: "mentions",
			account: undefined,
			search: "sam",
			replyFilter: "unreplied",
			limit: 5,
		});
		expect(result).toEqual([
			expect.objectContaining({
				id: "tweet_1",
				url: "https://x.com/sam/status/tweet_1",
				plainText: "Hi @sam https://example.com/demo",
				markdown:
					"Hi [@sam](https://x.com/sam) [example\\.com/demo](https://example.com/demo)",
				quotedTweetId: "tweet_q",
				replyToTweetId: null,
			}),
		]);
	});
});
