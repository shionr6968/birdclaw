// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBirdclawPathsForTests } from "./config";
import { getNativeDb, resetDatabaseForTests } from "./db";

const mocks = vi.hoisted(() => ({
	lookupAuthenticatedUser: vi.fn(),
	lookupUsersByHandles: vi.fn(),
	lookupUsersByIds: vi.fn(),
	muteUserViaXurl: vi.fn(),
	unmuteUserViaXurl: vi.fn(),
}));

vi.mock("./xurl", () => ({
	lookupAuthenticatedUser: mocks.lookupAuthenticatedUser,
	lookupUsersByHandles: mocks.lookupUsersByHandles,
	lookupUsersByIds: mocks.lookupUsersByIds,
	muteUserViaXurl: mocks.muteUserViaXurl,
	unmuteUserViaXurl: mocks.unmuteUserViaXurl,
}));

const tempDirs: string[] = [];

function makeTempHome() {
	const tempRoot = mkdtempSync(path.join(os.tmpdir(), "birdclaw-mutes-"));
	tempDirs.push(tempRoot);
	process.env.BIRDCLAW_HOME = tempRoot;
	return tempRoot;
}

describe("mutes", () => {
	beforeEach(() => {
		mocks.lookupAuthenticatedUser.mockReset();
		mocks.lookupUsersByHandles.mockReset();
		mocks.lookupUsersByIds.mockReset();
		mocks.muteUserViaXurl.mockReset();
		mocks.unmuteUserViaXurl.mockReset();

		mocks.lookupAuthenticatedUser.mockResolvedValue({
			id: "1",
			username: "steipete",
		});
		mocks.lookupUsersByHandles.mockResolvedValue([
			{
				id: "7",
				username: "amelia",
				name: "Amelia",
			},
		]);
		mocks.lookupUsersByIds.mockResolvedValue([
			{
				id: "7",
				username: "amelia",
				name: "Amelia",
			},
		]);
		mocks.muteUserViaXurl.mockResolvedValue({ ok: true, output: "muted" });
		mocks.unmuteUserViaXurl.mockResolvedValue({
			ok: true,
			output: "unmuted",
		});
	});

	afterEach(() => {
		resetDatabaseForTests();
		resetBirdclawPathsForTests();
		delete process.env.BIRDCLAW_HOME;

		for (const dir of tempDirs.splice(0)) {
			rmSync(dir, { recursive: true, force: true });
		}
	});

	it("mutes, lists, and unmutes profiles", async () => {
		makeTempHome();
		const { addMute, listMutes, removeMute } = await import("./mutes");

		const addResult = await addMute("acct_primary", "@amelia");
		expect(addResult.transport).toEqual({ ok: true, output: "muted" });
		expect(mocks.muteUserViaXurl).toHaveBeenCalledWith("1", "7");

		expect(listMutes({ account: "acct_primary" })).toEqual([
			expect.objectContaining({
				accountId: "acct_primary",
				profile: expect.objectContaining({
					handle: "amelia",
				}),
			}),
		]);

		const removeResult = await removeMute("acct_primary", "@amelia");
		expect(removeResult.transport).toEqual({ ok: true, output: "unmuted" });
		expect(mocks.unmuteUserViaXurl).toHaveBeenCalledWith("1", "7");
		expect(listMutes({ account: "acct_primary" })).toEqual([]);
	});

	it("falls back to local-only mute transport when xurl data is unavailable", async () => {
		makeTempHome();
		mocks.lookupAuthenticatedUser.mockResolvedValue(null);
		const { addMute, listMutes, removeMute } = await import("./mutes");

		await expect(addMute("acct_primary", "@amelia")).resolves.toMatchObject({
			transport: {
				ok: false,
				output: "xurl mute transport unavailable for this profile",
			},
		});
		await expect(removeMute("acct_primary", "@amelia")).resolves.toMatchObject({
			transport: {
				ok: false,
				output: "xurl unmute transport unavailable for this profile",
			},
		});
		expect(listMutes({ account: "acct_primary" })).toEqual([]);
	});

	it("rejects muting the current account and supports numeric lookups", async () => {
		makeTempHome();
		const { addMute } = await import("./mutes");

		await expect(addMute("acct_primary", "@steipete")).rejects.toThrow(
			"Cannot mute the current account",
		);

		await expect(addMute("acct_primary", "7")).resolves.toMatchObject({
			profile: expect.objectContaining({
				handle: "amelia",
			}),
		});
	});

	it("persists mute rows in sqlite", async () => {
		makeTempHome();
		const { addMute } = await import("./mutes");

		await addMute("acct_primary", "@amelia");

		expect(
			getNativeDb()
				.prepare("select account_id, profile_id, source from mutes")
				.all(),
		).toEqual([
			{
				account_id: "acct_primary",
				profile_id: "profile_amelia",
				source: "manual",
			},
		]);
	});
});
