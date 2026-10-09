/**
 * Interface text that today lives in the site chrome: the skip link, the 404
 * page and the error page. The components read these constants, and the site
 * settings seed (`0009_site_settings`) is generated from them, so the seeded
 * values are the live text exactly. From task B5 the site reads the published
 * settings instead, with these as the fallback.
 */
export const INTERFACE_TEXT = {
  skipLink: "Skip to content",
  notFoundKicker: "404",
  notFoundTitle: "This page is not on the map",
  notFoundBody: "Try Destinations, Tours, or the home page.",
  errorTitle: "Something went wrong",
  errorFallback: "An unexpected error occurred. Try reloading the page.",
} as const;
