// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const execFileAsyncMock = vi.fn();

vi.mock("node:child_process", () => ({
	execFile: Object.assign(vi.fn(), {
		[Symbol.for("nodejs.util.promisify.custom")]: execFileAsyncMock,
	}),
}));

describe("bird transport wrapper", () => {
	afterEach(() => {
		vi.resetModules();
		execFileAsyncMock.mockReset();
		delete process.env.BIRDCLAW_BIRD_COMMAND;
	});

	it("maps bird mentions json into xurl-compatible payloads", async () => {
		process.env.BIRDCLAW_BIRD_COMMAND = "/tmp/bird";
		execFileAsyncMock.mockResolvedValue({
			stdout: JSON.stringify([
				{
					id: "tweet_1",
					text: "hello from bird",
					createdAt: "Fri Mar 13 02:01:58 +0000 2026",
					replyCount: 1,
					retweetCount: 2,
					likeCount: 3,
					conversationId: "tweet_root_1",
					authorId: "42",
					author: {
						username: "sam",
						name: "Sam",
					},
					media: [
						{
							type: "photo",
							url: "https://pbs.twimg.com/media/demo.jpg",
						},
					],
				},
			]),
		});
		const { listMentionsViaBird } = await import("./bird");

		const payload = await listMentionsViaBird({
			maxResults: 12,
		});

		expect(execFileAsyncMock).toHaveBeenCalledWith("/tmp/bird", [
			"mentions",
			"-n",
			"12",
			"--json",
		]);
		expect(payload).toEqual({
			data: [
				expect.objectContaining({
					id: "tweet_1",
					author_id: "42",
					text: "hello from bird",
					conversation_id: "tweet_root_1",
					public_metrics: expect.objectContaining({
						reply_count: 1,
						retweet_count: 2,
						like_count: 3,
					}),
					entities: expect.objectContaining({
						urls: [
							expect.objectContaining({
								url: "https://pbs.twimg.com/media/demo.jpg",
								media_key: "bird_media_0",
							}),
						],
					}),
				}),
			],
			includes: {
				users: [
					{
						id: "42",
						username: "sam",
						name: "Sam",
					},
				],
			},
			meta: expect.objectContaining({
				result_count: 1,
				page_count: 1,
				next_token: null,
			}),
		});
	});
});
