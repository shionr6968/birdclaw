import { formatCompactNumber, formatShortTimestamp } from "#/lib/present";
import type { DmConversationItem, DmMessageItem } from "#/lib/types";
import {
	actionButtonClass,
	composerBarClass,
	composerInputClass,
	composerShellClass,
	contextBioClass,
	contextHandleClass,
	contextRailClass,
	contextStatRowClass,
	contextStatsClass,
	contextStatTermClass,
	contextStatValueClass,
	cx,
	dmBioPreviewClass,
	dmGridClass,
	dmListClass,
	dmListCopyClass,
	dmListItemActiveClass,
	dmListItemClass,
	dmPreviewTextClass,
	emptyStateClass,
	eyebrowClass,
	identityRowClass,
	messageBubbleClass,
	messageBubbleOutboundClass,
	messageMetaClass,
	messageRowClass,
	messageRowOutboundClass,
	messageStackClass,
	metaStackClass,
	pillAlertClass,
	pillClass,
	pillSoftClass,
	threadBioClass,
	threadHeaderClass,
	threadShellClass,
	threadSubtitleClass,
	threadTitleClass,
	timestampClass,
} from "#/lib/ui";
import { AvatarChip } from "./AvatarChip";

function clampBio(value: string, limit = 120) {
	if (value.length <= limit) return value;
	return `${value.slice(0, limit).trimEnd()}...`;
}

function MessageBubble({ message }: { message: DmMessageItem }) {
	return (
		<div
			className={cx(
				messageRowClass,
				message.direction === "outbound" && messageRowOutboundClass,
			)}
		>
			<div className={messageMetaClass}>
				<span>{message.sender.displayName}</span>
				<span>{formatShortTimestamp(message.createdAt)}</span>
			</div>
			<div
				className={cx(
					messageBubbleClass,
					message.direction === "outbound" && messageBubbleOutboundClass,
				)}
			>
				{message.text}
			</div>
		</div>
	);
}

export function DmWorkspace({
	conversations,
	selectedConversation,
	selectedMessages,
	onSelectConversation,
	replyDraft,
	onReplyDraftChange,
	onReplySend,
}: {
	conversations: DmConversationItem[];
	selectedConversation: DmConversationItem | null;
	selectedMessages: DmMessageItem[];
	onSelectConversation: (conversationId: string) => void;
	replyDraft: string;
	onReplyDraftChange: (value: string) => void;
	onReplySend: (conversationId: string) => void;
}) {
	const participant = selectedConversation?.participant ?? null;
	const heroLabel = participant
		? `${formatCompactNumber(participant.followersCount)} followers · score ${selectedConversation?.influenceScore ?? 0} · ${selectedConversation?.influenceLabel}`
		: "No conversation selected";

	return (
		<section className={dmGridClass}>
			<aside className={dmListClass}>
				{conversations.map((conversation) => {
					const active = conversation.id === selectedConversation?.id;
					return (
						<button
							key={conversation.id}
							className={cx(dmListItemClass, active && dmListItemActiveClass)}
							onClick={() => onSelectConversation(conversation.id)}
							type="button"
						>
							<AvatarChip
								hue={conversation.participant.avatarHue}
								name={conversation.participant.displayName}
							/>
							<div className={dmListCopyClass}>
								<div className={identityRowClass}>
									<strong>{conversation.participant.displayName}</strong>
									<span>@{conversation.participant.handle}</span>
								</div>
								<p className={cx(dmPreviewTextClass, dmBioPreviewClass)}>
									{clampBio(conversation.participant.bio, 84)}
								</p>
								<p className={dmPreviewTextClass}>
									{conversation.lastMessagePreview}
								</p>
							</div>
							<div className={metaStackClass}>
								<span
									className={cx(
										pillClass,
										conversation.needsReply ? pillAlertClass : pillSoftClass,
									)}
								>
									{conversation.needsReply ? "needs reply" : "clear"}
								</span>
								<span className={cx(pillClass, pillSoftClass)}>
									{conversation.influenceScore} · {conversation.influenceLabel}
								</span>
								<span className={timestampClass}>
									{formatShortTimestamp(conversation.lastMessageAt)}
								</span>
							</div>
						</button>
					);
				})}
			</aside>

			<div className={threadShellClass}>
				{selectedConversation ? (
					<>
						<header className={threadHeaderClass}>
							<div>
								<p className={eyebrowClass}>direct messages</p>
								<h2 className={threadTitleClass}>
									{selectedConversation.participant.displayName}
								</h2>
								<p className={threadSubtitleClass}>{heroLabel}</p>
								<p className={threadBioClass}>{participant?.bio}</p>
							</div>
							<button
								className={actionButtonClass}
								onClick={() => onReplySend(selectedConversation.id)}
								type="button"
							>
								Reply
							</button>
						</header>
						<div className={messageStackClass}>
							{selectedMessages.map((message) => (
								<MessageBubble key={message.id} message={message} />
							))}
						</div>
						<div className={composerShellClass}>
							<textarea
								className={composerInputClass}
								onChange={(event) => onReplyDraftChange(event.target.value)}
								placeholder={`Reply to @${selectedConversation.participant.handle}`}
								rows={4}
								value={replyDraft}
							/>
							<div className={composerBarClass}>
								<span className={timestampClass}>
									{selectedConversation.needsReply
										? "Reply still owed"
										: "Thread clear"}
								</span>
								<button
									className={actionButtonClass}
									disabled={!replyDraft.trim()}
									onClick={() => onReplySend(selectedConversation.id)}
									type="button"
								>
									Send reply
								</button>
							</div>
						</div>
					</>
				) : (
					<div className={emptyStateClass}>No DM selected.</div>
				)}
			</div>

			<aside className={contextRailClass}>
				{participant ? (
					<>
						<p className={eyebrowClass}>sender context</p>
						<AvatarChip
							hue={participant.avatarHue}
							name={participant.displayName}
							size="large"
						/>
						<h3 className={threadTitleClass}>{participant.displayName}</h3>
						<p className={cx("context-handle", contextHandleClass)}>
							@{participant.handle}
						</p>
						<p className={cx("context-bio", contextBioClass)}>
							{participant.bio}
						</p>
						<dl className={contextStatsClass}>
							<div className={contextStatRowClass}>
								<dt className={contextStatTermClass}>Followers</dt>
								<dd className={contextStatValueClass}>
									{formatCompactNumber(participant.followersCount)}
								</dd>
							</div>
							<div className={contextStatRowClass}>
								<dt className={contextStatTermClass}>Influence</dt>
								<dd className={contextStatValueClass}>
									{selectedConversation?.influenceScore} ·{" "}
									{selectedConversation?.influenceLabel}
								</dd>
							</div>
							<div className={contextStatRowClass}>
								<dt className={contextStatTermClass}>Reply state</dt>
								<dd className={contextStatValueClass}>
									{selectedConversation?.needsReply ? "Needs reply" : "Replied"}
								</dd>
							</div>
							<div className={contextStatRowClass}>
								<dt className={contextStatTermClass}>Last message</dt>
								<dd className={contextStatValueClass}>
									{formatShortTimestamp(
										selectedConversation?.lastMessageAt ??
											participant.createdAt,
									)}
								</dd>
							</div>
						</dl>
					</>
				) : (
					<div className={emptyStateClass}>
						Select a conversation to see the sender bio.
					</div>
				)}
			</aside>
		</section>
	);
}
