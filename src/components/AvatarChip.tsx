import { useState } from "react";
import { getInitials } from "#/lib/present";
import { avatarChipClass, avatarChipLargeClass, cx } from "#/lib/ui";

export function AvatarChip({
	profileId,
	avatarUrl,
	name,
	hue,
	size = "default",
}: {
	profileId?: string;
	avatarUrl?: string;
	name: string;
	hue: number;
	size?: "default" | "large";
}) {
	const avatarSrc =
		profileId && avatarUrl
			? `/api/avatar?profileId=${encodeURIComponent(profileId)}`
			: null;
	const [failedSrc, setFailedSrc] = useState<string | null>(null);
	const showImage = avatarSrc && failedSrc !== avatarSrc;

	return (
		<span
			className={cx(
				avatarChipClass,
				"avatar-chip",
				size === "large" && cx(avatarChipLargeClass, "avatar-chip-large"),
			)}
			style={{ backgroundColor: `hsl(${hue} 72% 50%)` }}
		>
			{showImage ? (
				<img
					alt={name}
					className="size-full rounded-[inherit] object-cover"
					loading="lazy"
					onError={() => setFailedSrc(avatarSrc)}
					src={avatarSrc}
				/>
			) : (
				getInitials(name)
			)}
		</span>
	);
}
