import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "./blocks";

const BlocksRoute = Route.options.component as ComponentType;

describe("blocks route", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("loads blocks and submits block/unblock actions", async () => {
		let blockResponse = {
			items: [
				{
					accountId: "acct_primary",
					accountHandle: "@steipete",
					source: "manual",
					blockedAt: "2026-03-08T12:00:00.000Z",
					profile: {
						id: "profile_user_7",
						handle: "amelia",
						displayName: "Amelia N",
						bio: "Design systems",
						followersCount: 4200,
						avatarHue: 320,
						createdAt: "2026-03-08T12:00:00.000Z",
					},
				},
			],
			matches: [
				{
					profile: {
						id: "profile_user_42",
						handle: "sam",
						displayName: "Sam Altman",
						bio: "Working on AGI",
						followersCount: 3180000,
						avatarHue: 210,
						createdAt: "2026-03-08T12:00:00.000Z",
					},
					isBlocked: false,
				},
			],
		};
		const fetchMock = vi.fn(
			async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input);
				if (url.endsWith("/api/status")) {
					return new Response(
						JSON.stringify({
							stats: { home: 3, mentions: 1, dms: 4, needsReply: 2, inbox: 3 },
							transport: { statusText: "xurl available" },
							accounts: [
								{ id: "acct_primary", handle: "@steipete", name: "Peter" },
							],
							archives: [],
						}),
					);
				}
				if (url.includes("/api/blocks")) {
					return new Response(JSON.stringify(blockResponse));
				}
				if (url.endsWith("/api/action") && init?.method === "POST") {
					const body = JSON.parse(String(init.body)) as Record<string, string>;
					if (body.kind === "syncBlocks") {
						blockResponse = {
							...blockResponse,
							items: [
								...blockResponse.items,
								{
									accountId: "acct_primary",
									accountHandle: "@steipete",
									source: "remote",
									blockedAt: "2026-03-09T12:00:00.000Z",
									profile: {
										id: "profile_user_8",
										handle: "avawires",
										displayName: "Ava Wires",
										bio: "Infra reporter",
										followersCount: 632000,
										avatarHue: 262,
										createdAt: "2026-03-08T12:00:00.000Z",
									},
								},
							],
						};
						return new Response(
							JSON.stringify({
								ok: true,
								synced: true,
								syncedCount: 1,
								transport: { ok: true, output: "synced 1 remote blocks" },
							}),
						);
					}
					return new Response(
						JSON.stringify({
							ok: true,
							profile: { handle: "sam" },
							transport: { output: "live writes disabled" },
						}),
					);
				}
				throw new Error(`Unexpected fetch ${url}`);
			},
		);
		vi.stubGlobal("fetch", fetchMock);

		render(<BlocksRoute />);

		expect(
			await screen.findByRole("heading", {
				name: "Maintain a clean blocklist locally.",
			}),
		).toBeInTheDocument();
		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/action",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						kind: "syncBlocks",
						accountId: "acct_primary",
					}),
				}),
			);
		});
		expect(
			await screen.findByText(/synced 1 remote blocks/i),
		).toBeInTheDocument();
		fireEvent.change(
			screen.getByPlaceholderText("Handle, name, bio, or X URL"),
			{
				target: { value: "@sam" },
			},
		);
		const [heroBlockButton] = screen.getAllByRole("button", { name: "Block" });
		if (!heroBlockButton) {
			throw new Error("Missing block button");
		}
		fireEvent.click(heroBlockButton);

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/action",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						kind: "blockProfile",
						accountId: "acct_primary",
						query: "@sam",
					}),
				}),
			);
		});

		const [firstUnblockButton] = screen.getAllByRole("button", {
			name: "Unblock",
		});
		if (!firstUnblockButton) {
			throw new Error("Missing unblock button");
		}
		fireEvent.click(firstUnblockButton);

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				"/api/action",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({
						kind: "unblockProfile",
						accountId: "acct_primary",
						query: "profile_user_7",
					}),
				}),
			);
		});
	});
});
