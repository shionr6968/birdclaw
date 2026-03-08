import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { InboxCard } from "#/components/InboxCard";
import type {
	InboxItem,
	InboxKind,
	InboxResponse,
	QueryEnvelope,
} from "#/lib/types";

export const Route = createFileRoute("/inbox")({
	component: InboxRoute,
});

function InboxRoute() {
	const [meta, setMeta] = useState<QueryEnvelope | null>(null);
	const [items, setItems] = useState<InboxItem[]>([]);
	const [kind, setKind] = useState<InboxKind>("mixed");
	const [minScore, setMinScore] = useState("40");
	const [hideLowSignal, setHideLowSignal] = useState(true);
	const [refreshTick, setRefreshTick] = useState(0);
	const [isScoring, setIsScoring] = useState(false);
	const [stats, setStats] = useState<InboxResponse["stats"] | null>(null);

	useEffect(() => {
		fetch("/api/status")
			.then((response) => response.json())
			.then((data: QueryEnvelope) => setMeta(data));
	}, []);

	useEffect(() => {
		const url = new URL("/api/inbox", window.location.origin);
		url.searchParams.set("kind", kind);
		url.searchParams.set("minScore", minScore);
		url.searchParams.set("refresh", String(refreshTick));
		if (hideLowSignal) {
			url.searchParams.set("hideLowSignal", "1");
		}

		fetch(url)
			.then((response) => response.json())
			.then((data: InboxResponse) => {
				setItems(data.items);
				setStats(data.stats);
			});
	}, [hideLowSignal, kind, minScore, refreshTick]);

	const subtitle = useMemo(() => {
		if (!meta || !stats) return "Ranking unreplied mentions and DMs...";
		return `${stats.total} items in queue · ${stats.openai} OpenAI scored · ${meta.transport.statusText}`;
	}, [meta, stats]);

	async function scoreNow() {
		setIsScoring(true);
		try {
			await fetch("/api/action", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					kind: "scoreInbox",
					scoreKind: kind,
					limit: 8,
				}),
			});
			setRefreshTick((value) => value + 1);
		} finally {
			setIsScoring(false);
		}
	}

	return (
		<main className="page-wrap">
			<section className="hero-shell">
				<div>
					<p className="eyebrow">inbox</p>
					<h2 className="hero-title">AI triage for mentions and DMs.</h2>
					<p className="hero-copy">{subtitle}</p>
				</div>
				<div className="hero-controls">
					<div className="segmented">
						{(["mixed", "mentions", "dms"] as const).map((value) => (
							<button
								key={value}
								className={
									value === kind ? "segment segment-active" : "segment"
								}
								onClick={() => setKind(value)}
								type="button"
							>
								{value}
							</button>
						))}
					</div>
					<input
						className="text-field text-field-short"
						inputMode="numeric"
						onChange={(event) => setMinScore(event.target.value)}
						placeholder="Min AI score"
						value={minScore}
					/>
					<button
						className={hideLowSignal ? "nav-link nav-link-active" : "nav-link"}
						onClick={() => setHideLowSignal((value) => !value)}
						type="button"
					>
						{hideLowSignal ? "Hide low-signal" : "Show all"}
					</button>
					<button
						className="action-button"
						disabled={isScoring}
						onClick={() => void scoreNow()}
						type="button"
					>
						{isScoring ? "Scoring..." : "Score with OpenAI"}
					</button>
				</div>
			</section>

			<section className="stack-grid">
				{items.map((item) => (
					<InboxCard key={item.id} item={item} />
				))}
			</section>
		</main>
	);
}
