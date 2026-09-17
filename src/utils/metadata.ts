import { PUBLIC_ENV } from "@/lib/public-env";
import type { Metadata } from "next/types";

export function createMetadata(override: Metadata): Metadata {
	return {
		...override,
		openGraph: {
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			url: "https://designcombo.dev",
			images: "/banner.png",
			siteName: "VEditor",
			...override.openGraph,
		},
		twitter: {
			card: "summary_large_image",
			creator: "@Combo",
			title: override.title ?? undefined,
			description: override.description ?? undefined,
			images: "/banner.png",
			...override.twitter,
		},
		icons: {
			icon: "/logo.svg"
		},
	};
}

export const baseUrl =
	PUBLIC_ENV.NODE_ENV === "development"
		? new URL("http://localhost:3000")
		: new URL("https://designcombo.dev");
