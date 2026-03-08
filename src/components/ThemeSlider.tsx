import { Monitor, Moon, Sun } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import { useMemo } from "react";
import { type ThemeValue, useTheme } from "#/lib/theme";
import {
	startThemeTransition,
	type ThemeTransitionContext,
} from "#/lib/theme-transition";

const THEME_OPTIONS = [
	{ key: "system", icon: Monitor, label: "System default" },
	{ key: "light", icon: Sun, label: "Light theme" },
	{ key: "dark", icon: Moon, label: "Dark theme" },
] as const satisfies Array<{
	key: ThemeValue;
	icon: typeof Sun;
	label: string;
}>;

const ACTIVE_ITEM_WIDTH_PX = 30;
const GAP_PX = 6;
const CONTAINER_PADDING_PX = 6;
const INDICATOR_SIZE_PX = 30;
const INDICATOR_OVERHANG_PX = (INDICATOR_SIZE_PX - ACTIVE_ITEM_WIDTH_PX) / 2;
const INDICATOR_BASE_OFFSET_PX = CONTAINER_PADDING_PX - INDICATOR_OVERHANG_PX;

function toPx(value: number) {
	return `${String(value)}px`;
}

export function ThemeSlider() {
	const { isReady, theme, resolvedTheme, setTheme } = useTheme();

	const activeIndex = useMemo(() => {
		const index = THEME_OPTIONS.findIndex((option) => option.key === theme);
		return index === -1 ? 0 : index;
	}, [theme]);

	const indicatorOffset = activeIndex * (ACTIVE_ITEM_WIDTH_PX + GAP_PX);
	const indicatorStyle = useMemo<CSSProperties>(
		() => ({
			left: toPx(INDICATOR_BASE_OFFSET_PX),
			transform: `translate(${toPx(indicatorOffset)}, -50%)`,
		}),
		[indicatorOffset],
	);
	const sliderStyle = useMemo<CSSProperties>(
		() => ({
			gridTemplateColumns: `repeat(${String(THEME_OPTIONS.length)}, ${toPx(
				ACTIVE_ITEM_WIDTH_PX,
			)})`,
			columnGap: toPx(GAP_PX),
			padding: `0 ${toPx(CONTAINER_PADDING_PX)}`,
			width: toPx(
				THEME_OPTIONS.length * ACTIVE_ITEM_WIDTH_PX +
					(THEME_OPTIONS.length - 1) * GAP_PX +
					CONTAINER_PADDING_PX * 2,
			),
		}),
		[],
	);

	return (
		<fieldset className="theme-slider-shell" aria-label="Theme selector">
			<div className="theme-slider" style={sliderStyle}>
				<div
					className={
						resolvedTheme === "dark"
							? "theme-slider-indicator theme-slider-indicator-dark"
							: "theme-slider-indicator"
					}
					style={indicatorStyle}
				/>
				{THEME_OPTIONS.map((option, index) => {
					const Icon = option.icon;
					const isActive = index === activeIndex;

					const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
						if (isActive) return;

						const context: ThemeTransitionContext = {
							element: event.currentTarget,
							pointerClientX: event.clientX,
							pointerClientY: event.clientY,
						};

						startThemeTransition({
							nextTheme: option.key,
							currentTheme: theme,
							setTheme,
							context,
						});
					};

					return (
						<button
							key={option.key}
							type="button"
							className={
								isActive
									? "theme-slider-button theme-slider-button-active"
									: "theme-slider-button"
							}
							onClick={handleClick}
							aria-label={option.label}
							aria-pressed={isActive}
							data-testid={`theme-${option.key}`}
							disabled={!isReady}
						>
							<Icon className="theme-slider-icon" strokeWidth={1.8} />
						</button>
					);
				})}
			</div>
		</fieldset>
	);
}
