import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/page-hero";
import { pageHead } from "@/lib/seo";
import sources from "../../../public/images/image-sources.json";

export const Route = createFileRoute("/about/image-credits")({
  head: () =>
    pageHead(
      "Image credits",
      "Attribution for the Creative Commons photographs used on Tourism Is Life, with author, source page and licence for each.",
      "/about/image-credits",
    ),
  component: Page,
});

type Entry = {
  filename: string;
  page?: string;
  subject?: string;
  source?: string;
  license?: string;
  author?: string;
};

const LICENSE_URL = /^CC (BY(?:-SA)?) (\d\.\d)$/;

function licenseUrl(license: string): string | null {
  const m = LICENSE_URL.exec(license);
  return m ? `https://creativecommons.org/licenses/${m[1].toLowerCase()}/${m[2]}/` : null;
}

// Only licences that require attribution appear here (CC BY / CC BY-SA). CC0,
// public-domain and Unsplash images need no credit; images with no verified
// licence are not credited on this page because none can be stated for them.
const credits = (sources as Entry[])
  .filter((e) => e.license && /^CC BY/.test(e.license))
  .sort((a, b) => (a.subject ?? "").localeCompare(b.subject ?? ""));

function Page() {
  return (
    <>
      <PageHero
        kicker="Credits"
        title="Image credits"
        lede="Several photographs on this site are shared under Creative Commons licences. Thank you to the photographers below."
        image="/images/cities/freetown-street.jpg"
        imageAlt="A busy street in central Freetown, Sierra Leone"
      />
      <div className="container-page py-10">
        <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
          {credits.map((c) => {
            const url = licenseUrl(c.license ?? "");
            const from = c.page || c.source;
            return (
              <li key={c.filename} className="grid gap-1 p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-x-6">
                <div>
                  <p className="font-medium text-heading">{c.subject}</p>
                  <p className="text-muted">
                    {c.author && c.author !== "Unknown" ? `By ${c.author}` : "Author not recorded on the source page"}
                    {from?.startsWith("http") ? (
                      <>
                        {" · "}
                        <a href={from} target="_blank" rel="noopener noreferrer" className="underline hover:text-heading">
                          Source
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <p className="text-muted">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-heading">
                      {c.license}
                    </a>
                  ) : (
                    c.license
                  )}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">
          Photographs are used as published on their source pages under the licence shown. Share-alike
          licences (CC BY-SA) apply to the image itself, not to the rest of this website.
        </p>
      </div>
    </>
  );
}
