import { createFileRoute } from "@tanstack/react-router";
import { readCachedAvatar } from "#/lib/avatar-cache";

export const Route = createFileRoute("/api/avatar")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const url = new URL(request.url);
				const profileId = url.searchParams.get("profileId")?.trim();

				if (!profileId) {
					return new Response(
						JSON.stringify({ ok: false, message: "Missing profileId" }),
						{
							status: 400,
							headers: { "content-type": "application/json" },
						},
					);
				}

				const avatar = await readCachedAvatar(profileId);
				if (!avatar) {
					return new Response(
						JSON.stringify({ ok: false, message: "Avatar not found" }),
						{
							status: 404,
							headers: { "content-type": "application/json" },
						},
					);
				}

				return new Response(new Uint8Array(avatar.buffer), {
					headers: {
						"cache-control": "public, max-age=86400, immutable",
						"content-type": avatar.contentType,
					},
				});
			},
		},
	},
});
