// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const execFileAsyncMock = vi.fn();

vi.mock("node:child_process", () => ({
	execFile: vi.fn(),
}));

vi.mock("node:util", () => ({
	promisify: vi.fn(() => execFileAsyncMock),
}));

describe("bird action transport wrapper", () => {
	afterEach(() => {
		vi.resetModules();
		execFileAsyncMock.mockReset();
		delete process.env.BIRDCLAW_BIRD_COMMAND;
		delete process.env.BIRDCLAW_DISABLE_LIVE_WRITES;
	});

	it("blocks via bird and verifies with status", async () => {
		process.env.BIRDCLAW_BIRD_COMMAND = "/tmp/bird";
		delete process.env.BIRDCLAW_DISABLE_LIVE_WRITES;
		execFileAsyncMock
			.mockResolvedValueOnce({ stdout: "✅ Blocked @sam\n" })
			.mockResolvedValueOnce({
				stdout: JSON.stringify({ blocking: true, muting: false }),
			});

		const { blockUserViaBird } = await import("./bird-actions");
		const result = await blockUserViaBird("42");

		expect(execFileAsyncMock).toHaveBeenNthCalledWith(1, "/tmp/bird", [
			"block",
			"42",
		]);
		expect(execFileAsyncMock).toHaveBeenNthCalledWith(2, "/tmp/bird", [
			"status",
			"42",
			"--json",
		]);
		expect(result).toEqual({
			ok: true,
			output: "✅ Blocked @sam; verified blocking=true",
		});
	});

	it("fails when verify state mismatches", async () => {
		process.env.BIRDCLAW_BIRD_COMMAND = "/tmp/bird";
		delete process.env.BIRDCLAW_DISABLE_LIVE_WRITES;
		execFileAsyncMock
			.mockResolvedValueOnce({ stdout: "✅ Unblocked @sam\n" })
			.mockResolvedValueOnce({
				stdout: JSON.stringify({ blocking: true, muting: false }),
			});

		const { unblockUserViaBird } = await import("./bird-actions");
		const result = await unblockUserViaBird("42");

		expect(result).toEqual({
			ok: false,
			output: "✅ Unblocked @sam; bird status verify blocking=true",
		});
	});

	it("returns command failures", async () => {
		process.env.BIRDCLAW_BIRD_COMMAND = "/tmp/bird";
		delete process.env.BIRDCLAW_DISABLE_LIVE_WRITES;
		execFileAsyncMock.mockRejectedValue(new Error("bird down"));

		const { muteUserViaBird } = await import("./bird-actions");
		const result = await muteUserViaBird("42");

		expect(result).toEqual({
			ok: false,
			output: "bird down",
		});
	});
});
