import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getBirdclawPaths } from "./config";
import { getNativeDb } from "./db";

const AVATAR_SIZE_SUFFIX =
	/(?:(?:_normal|_bigger|_mini))(?=\.(?:jpg|jpeg|png|webp|gif)(?:$|\?))/i;

function sanitizeFileToken(value: string) {
	return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function getAvatarCacheDir() {
	const { mediaThumbsDir } = getBirdclawPaths();
	const dir = path.join(mediaThumbsDir, "avatars");
	mkdirSync(dir, { recursive: true });
	return dir;
}

function getExtensionFromContentType(contentType: string | null) {
	const mime = contentType?.split(";")[0].trim().toLowerCase() ?? "";
	if (mime === "image/png") return ".png";
	if (mime === "image/webp") return ".webp";
	if (mime === "image/gif") return ".gif";
	if (mime === "image/svg+xml") return ".svg";
	return ".jpg";
}

function getContentTypeFromExtension(extension: string) {
	switch (extension.toLowerCase()) {
		case ".png":
			return "image/png";
		case ".webp":
			return "image/webp";
		case ".gif":
			return "image/gif";
		case ".svg":
			return "image/svg+xml";
		default:
			return "image/jpeg";
	}
}

function getExtensionFromAvatarUrl(avatarUrl: string) {
	try {
		const url = new URL(avatarUrl);
		const extension = path.extname(url.pathname).toLowerCase();
		if (extension === ".png" || extension === ".webp" || extension === ".gif") {
			return extension;
		}
		return extension === ".svg" ? ".svg" : ".jpg";
	} catch {
		return ".jpg";
	}
}

function decodeDataUrl(dataUrl: string) {
	if (!dataUrl.startsWith("data:")) {
		throw new Error("Invalid avatar data URL");
	}

	const separatorIndex = dataUrl.indexOf(",");
	if (separatorIndex < 0) {
		throw new Error("Invalid avatar data URL");
	}

	const metadata = dataUrl.slice(5, separatorIndex);
	const payload = dataUrl.slice(separatorIndex + 1);
	const contentType = metadata.split(";")[0] || "application/octet-stream";
	const isBase64 = metadata.includes(";base64");
	return {
		contentType,
		buffer: isBase64
			? Buffer.from(payload, "base64")
			: Buffer.from(decodeURIComponent(payload), "utf8"),
	};
}

function getAvatarUrlForProfile(profileId: string) {
	const row = getNativeDb()
		.prepare("select avatar_url from profiles where id = ?")
		.get(profileId) as { avatar_url: string | null } | undefined;
	return row?.avatar_url ?? null;
}

export function normalizeAvatarUrl(value: unknown) {
	if (typeof value !== "string" || value.trim().length === 0) {
		return null;
	}

	const trimmed = value.trim();
	if (trimmed.startsWith("data:image/")) {
		return trimmed;
	}

	try {
		const url = new URL(trimmed);
		url.pathname = url.pathname.replace(AVATAR_SIZE_SUFFIX, "");
		return url.toString();
	} catch {
		return trimmed;
	}
}

export function getAvatarCachePath(profileId: string, avatarUrl: string) {
	const normalizedAvatarUrl = normalizeAvatarUrl(avatarUrl);
	if (!normalizedAvatarUrl) {
		throw new Error("Missing avatar URL");
	}

	const hash = createHash("sha1").update(normalizedAvatarUrl).digest("hex");
	const extension = normalizedAvatarUrl.startsWith("data:")
		? getExtensionFromContentType(
				/^data:([^;,]+)/i.exec(normalizedAvatarUrl)?.[1] ?? null,
			)
		: getExtensionFromAvatarUrl(normalizedAvatarUrl);

	return path.join(
		getAvatarCacheDir(),
		`${sanitizeFileToken(profileId)}-${hash}${extension}`,
	);
}

async function fetchRemoteAvatar(avatarUrl: string) {
	const response = await fetch(avatarUrl, {
		headers: {
			"user-agent": "birdclaw/avatar-cache",
		},
	});
	if (!response.ok) {
		throw new Error(`Avatar fetch failed with ${response.status}`);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	return {
		contentType: response.headers.get("content-type") ?? "image/jpeg",
		buffer,
	};
}

export async function readCachedAvatar(profileId: string) {
	const avatarUrl = getAvatarUrlForProfile(profileId);
	if (!avatarUrl) {
		return null;
	}

	const normalizedAvatarUrl = normalizeAvatarUrl(avatarUrl);
	if (!normalizedAvatarUrl) {
		return null;
	}

	const cachePath = getAvatarCachePath(profileId, normalizedAvatarUrl);
	const cachedExtension = path.extname(cachePath);

	try {
		return {
			buffer: readFileSync(cachePath),
			contentType: getContentTypeFromExtension(cachedExtension),
			cachePath,
			avatarUrl: normalizedAvatarUrl,
		};
	} catch {
		const payload = normalizedAvatarUrl.startsWith("data:")
			? decodeDataUrl(normalizedAvatarUrl)
			: await fetchRemoteAvatar(normalizedAvatarUrl);

		writeFileSync(cachePath, payload.buffer);
		return {
			buffer: payload.buffer,
			contentType: payload.contentType,
			cachePath,
			avatarUrl: normalizedAvatarUrl,
		};
	}
}

export const __test__ = {
	decodeDataUrl,
	getAvatarCacheDir,
	getContentTypeFromExtension,
	getExtensionFromAvatarUrl,
	sanitizeFileToken,
};
