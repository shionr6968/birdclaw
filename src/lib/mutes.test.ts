// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBirdclawPathsForTests } from "./config";
import { getNativeDb, resetDatabaseForTests } from "./db";

const mocks = vi.hoisted(() => ({
	lookupUsersByHandles: vi.fn(),
	lookupUsersByIds: vi.fn(),
	muteUserViaBird: vi.fn(),
	unmuteUserViaBird: vi.fn(),
}));

vi.mock("./bird-actions", () => ({
	muteUserViaBird: mocks.muteUserViaBird,
	unmuteUserViaBird: mocks.unmuteUserViaBird,
}));

vi.mock("./xurl", () => ({
	lookupUsersByHandles: mocks.lookupUsersByHandles,
	lookupUsersByIds: mocks.lookupUsersByIds,
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
		mocks.lookupUsersByHandles.mockReset();
		mocks.lookupUsersByIds.mockReset();
		mocks.muteUserViaBird.mockReset();
		mocks.unmuteUserViaBird.mockReset();
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
		mocks.muteUserViaBird.mockResolvedValue({
			ok: true,
			output: "muted via bird; verified muting=true",
		});
		mocks.unmuteUserViaBird.mockResolvedValue({
			ok: true,
			output: "unmuted via bird; verified muting=false",
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
		expect(addResult.transport).toEqual({
			ok: true,
			output: "muted via bird; verified muting=true",
		});
		expect(mocks.muteUserViaBird).toHaveBeenCalledWith("7");

		expect(listMutes({ account: "acct_primary" })).toEqual([
			expect.objectContaining({
				accountId: "acct_primary",
				profile: expect.objectContaining({
					handle: "amelia",
				}),
			}),
		]);

		const removeResult = await removeMute("acct_primary", "@amelia");
		expect(removeResult.transport).toEqual({
			ok: true,
			output: "unmuted via bird; verified muting=false",
		});
		expect(mocks.unmuteUserViaBird).toHaveBeenCalledWith("7");
		expect(listMutes({ account: "acct_primary" })).toEqual([]);
	});

	it("does not persist local mutes when bird transport fails", async () => {
		makeTempHome();
		mocks.muteUserViaBird.mockResolvedValue({
			ok: false,
			output: "bird mute failed",
		});
		const { addMute, listMutes } = await import("./mutes");

		await expect(addMute("acct_primary", "@amelia")).resolves.toMatchObject({
			ok: false,
			transport: {
				ok: false,
				output: "bird mute failed",
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

	it("keeps local rows when bird unmute fails", async () => {
		makeTempHome();
		mocks.unmuteUserViaBird.mockResolvedValue({
			ok: false,
			output: "bird unmute failed",
		});
		const { addMute, listMutes, removeMute } = await import("./mutes");

		await addMute("acct_primary", "@amelia");
		await expect(removeMute("acct_primary", "@amelia")).resolves.toMatchObject({
			ok: false,
			transport: {
				ok: false,
				output: "bird unmute failed",
			},
		});
		expect(listMutes({ account: "acct_primary" })).toHaveLength(1);
	});
});
