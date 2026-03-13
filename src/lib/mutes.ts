import { muteUserViaBird, unmuteUserViaBird } from "./bird-actions";
import { getNativeDb } from "./db";
import {
	getAccountHandle,
	getDefaultAccountId,
	normalizeProfileQuery,
	resolveProfile,
	toProfile,
} from "./moderation-target";
import type { BlockItem } from "./types";

function getBirdActionQuery(
	query: string,
	resolved: Awaited<ReturnType<typeof resolveProfile>>,
) {
	return (
		resolved.externalUserId ??
		resolved.profile.handle ??
		normalizeProfileQuery(query)
	);
}

export interface MuteItem {
	accountId: string;
	accountHandle: string;
	source: string;
	mutedAt: string;
	profile: BlockItem["profile"];
}

export function listMutes({
	account,
	search,
	limit = 50,
}: {
	account?: string;
	search?: string;
	limit?: number;
} = {}): MuteItem[] {
	const db = getNativeDb();
	const params: Array<string | number> = [];
	let where = "where 1 = 1";

	if (account && account !== "all") {
		where += " and m.account_id = ?";
		params.push(account);
	}

	if (search?.trim()) {
		where += " and (p.handle like ? or p.display_name like ? or p.bio like ?)";
		params.push(
			`%${search.trim()}%`,
			`%${search.trim()}%`,
			`%${search.trim()}%`,
		);
	}

	params.push(limit);

	const rows = db
		.prepare(
			`
      select
        m.account_id,
        a.handle as account_handle,
        m.source,
        m.created_at as muted_at,
        p.id,
        p.handle,
        p.display_name,
        p.bio,
        p.followers_count,
        p.avatar_hue,
        p.avatar_url,
        p.created_at
      from mutes m
      join accounts a on a.id = m.account_id
      join profiles p on p.id = m.profile_id
      ${where}
      order by m.created_at desc
      limit ?
      `,
		)
		.all(...params) as Array<Record<string, unknown>>;

	return rows.map((row) => ({
		accountId: String(row.account_id),
		accountHandle: String(row.account_handle),
		source: String(row.source),
		mutedAt: String(row.muted_at),
		profile: toProfile(row),
	}));
}

export async function addMute(accountId: string, query: string) {
	const db = getNativeDb();
	const resolvedAccountId = accountId || getDefaultAccountId(db);
	const accountHandle = getAccountHandle(db, resolvedAccountId);
	if (normalizeProfileQuery(query) === accountHandle) {
		throw new Error("Cannot mute the current account");
	}
	const resolved = await resolveProfile(query);
	const transport = await muteUserViaBird(getBirdActionQuery(query, resolved));

	if (!transport.ok) {
		return {
			ok: false,
			action: "mute",
			accountId: resolvedAccountId,
			profile: resolved.profile,
			transport,
		};
	}

	const mutedAt = new Date().toISOString();
	db.prepare(
		`
    insert into mutes (account_id, profile_id, source, created_at)
    values (?, ?, 'manual', ?)
    on conflict(account_id, profile_id) do update set
      source = excluded.source,
      created_at = excluded.created_at
    `,
	).run(resolvedAccountId, resolved.profile.id, mutedAt);

	return {
		ok: true,
		action: "mute",
		accountId: resolvedAccountId,
		mutedAt,
		profile: resolved.profile,
		transport,
	};
}

export async function recordMute(accountId: string, query: string) {
	const db = getNativeDb();
	const resolvedAccountId = accountId || getDefaultAccountId(db);
	const accountHandle = getAccountHandle(db, resolvedAccountId);
	if (normalizeProfileQuery(query) === accountHandle) {
		throw new Error("Cannot mute the current account");
	}
	const resolved = await resolveProfile(query);

	const mutedAt = new Date().toISOString();
	db.prepare(
		`
    insert into mutes (account_id, profile_id, source, created_at)
    values (?, ?, 'manual', ?)
    on conflict(account_id, profile_id) do update set
      source = excluded.source,
      created_at = excluded.created_at
    `,
	).run(resolvedAccountId, resolved.profile.id, mutedAt);

	return {
		ok: true,
		action: "record-mute",
		accountId: resolvedAccountId,
		mutedAt,
		profile: resolved.profile,
	};
}

export async function removeMute(accountId: string, query: string) {
	const db = getNativeDb();
	const resolvedAccountId = accountId || getDefaultAccountId(db);
	const resolved = await resolveProfile(query);
	const transport = await unmuteUserViaBird(
		getBirdActionQuery(query, resolved),
	);

	if (!transport.ok) {
		return {
			ok: false,
			action: "unmute",
			accountId: resolvedAccountId,
			profile: resolved.profile,
			transport,
		};
	}

	db.prepare("delete from mutes where account_id = ? and profile_id = ?").run(
		resolvedAccountId,
		resolved.profile.id,
	);

	return {
		ok: true,
		action: "unmute",
		accountId: resolvedAccountId,
		profile: resolved.profile,
		transport,
	};
}
