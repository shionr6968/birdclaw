import { getInitials } from "#/lib/present";
import { avatarChipClass, avatarChipLargeClass, cx } from "#/lib/ui";

export function AvatarChip({
	name,
	hue,
	size = "default",
}: {
	name: string;
	hue: number;
	size?: "default" | "large";
}) {
	return (
		<span
			className={cx(
				avatarChipClass,
				"avatar-chip",
				size === "large" && cx(avatarChipLargeClass, "avatar-chip-large"),
			)}
			style={{ backgroundColor: `hsl(${hue} 72% 50%)` }}
		>
			{getInitials(name)}
		</span>
	);
}
