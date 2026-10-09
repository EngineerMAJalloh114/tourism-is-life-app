import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { SiteShell } from "@/components/layout/site-shell";
import { AppErrorComponent } from "@/lib/error-component";
import { INTERFACE_TEXT } from "@/content/defaults/interface";
import { DEFAULT_DESCRIPTION, DEFAULT_SHARE_IMAGE } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { DEFAULT_THEME, INITIAL_THEME, THEME_BOOTSTRAP } from "@/lib/theme";
import appCss from "../styles.css?url";

const APP_NAME = "Tourism Is Life";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#1B2E28" },
      {
        name: "description",
        content: DEFAULT_DESCRIPTION,
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:image", content: `${SITE.website}${DEFAULT_SHARE_IMAGE}` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,650&display=swap",
      },
    ],
  }),
  errorComponent: AppErrorComponent,
  notFoundComponent: () => (
    <div className="container-page py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-ink">{INTERFACE_TEXT.notFoundKicker}</p>
      <h1 className="mt-2 font-display text-4xl text-heading">{INTERFACE_TEXT.notFoundTitle}</h1>
      <p className="mt-3 text-muted">{INTERFACE_TEXT.notFoundBody}</p>
    </div>
  ),
  component: () => (
    <html
      lang="en"
      className="antialiased"
      // Rendered server-side so a first-time visitor gets INITIAL_THEME with
      // zero flash — no cookie/localStorage read is possible at this point,
      // so this is a static value, not a lookup. THEME_BOOTSTRAP below only
      // has to correct this for a visitor with a *saved, different* choice;
      // suppressHydrationWarning covers exactly that expected mismatch.
      data-theme={INITIAL_THEME === DEFAULT_THEME ? undefined : INITIAL_THEME}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
        {/* Applies the saved theme before first paint so the page never flashes
            the default palette. Reads the same zustand-persist record the prefs
            store writes; the store re-applies it on rehydrate. */}
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOTSTRAP,
          }}
        />
      </head>
      <body className="bg-page text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <SiteShell>
            <Outlet />
          </SiteShell>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
