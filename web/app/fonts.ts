import { Figtree, IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";

/** Body font for the marketing site. Exposed as `--font-sans` in globals.css. */
export const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Body font for the dashboard, applied via `inter.className` on the shell. */
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Headings and metric values. Exposed as `font-display`. */
export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600"],
});

/** Identifiers, tokens, and code. Exposed as `font-mono`. */
export const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
