import { Link } from "@tanstack/react-router";
import type { InboxItem } from "#/lib/types";

function formatTime(value: string) {
	return new Intl.DateTimeFormat("en", {
		hour: "numeric",
		minute: "2-digit",
		month: "short",
		day: "numeric",
	}).format(new Date(value));
}

function formatFollowers(value: number) {
	return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

export function InboxCard({ item }: { item: InboxItem }) {
	return (
		<article className="content-card inbox-card">
			<div className="card-header">
				<div className="identity-block">
					<div
						className="avatar-chip"
						style={{
							backgroundColor: `hsl(${item.participant.avatarHue} 72% 50%)`,
						}}
					>
						{item.participant.displayName
							.split(" ")
							.map((part) => part[0] ?? "")
							.join("")
							.slice(0, 2)}
					</div>
					<div>
						<div className="identity-row">
							<strong>{item.participant.displayName}</strong>
							<span>@{item.participant.handle}</span>
							<span className="muted-dot" />
							<span>
								{formatFollowers(item.participant.followersCount)} followers
							</span>
						</div>
						<p className="bio-line">{item.participant.bio}</p>
					</div>
				</div>
				<div className="meta-stack">
					<span className="pill pill-soft">{item.entityKind}</span>
					<span className="pill pill-alert">score {item.score}</span>
					<span className="timestamp">{formatTime(item.createdAt)}</span>
				</div>
			</div>
			<p className="eyebrow">ai triage</p>
			<h3 className="inbox-title">{item.title}</h3>
			<p className="body-copy">{item.text}</p>
			<div className="inbox-analysis">
				<strong>{item.summary}</strong>
				<p>{item.reasoning}</p>
			</div>
			<div className="card-footer">
				<div className="metric-row">
					<span>{item.source}</span>
					<span>influence {item.influenceScore}</span>
					<span>{item.needsReply ? "needs reply" : "resolved"}</span>
				</div>
				<Link
					className="action-button"
					to={item.entityKind === "dm" ? "/dms" : "/mentions"}
				>
					Open
				</Link>
			</div>
		</article>
	);
}
