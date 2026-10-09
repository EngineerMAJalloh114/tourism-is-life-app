import { Link } from "@tanstack/react-router";

/**
 * The site-wide announcement (task A11; placed on the site in task B5). The
 * message is rendered as a text node, never as markup, and the link is either
 * a site path or an https address (the server refuses anything else).
 */
export type AnnouncementBarProps = { message: string; linkLabel?: string; link?: string };

export function AnnouncementBar({ message, linkLabel, link }: AnnouncementBarProps) {
  const internal = Boolean(link && link.startsWith("/") && !link.startsWith("//"));
  const external = Boolean(link && link.startsWith("https://"));
  return (
    <div role="region" aria-label="Announcement" className="bg-brand px-4 py-2 text-center text-sm text-ivory [overflow-wrap:anywhere]">
      <span>{message}</span>
      {link && linkLabel && (internal || external) ? (
        <>
          {" "}
          {internal ? (
            <Link to={link} className="font-medium text-ivory underline underline-offset-4">
              {linkLabel}
            </Link>
          ) : (
            <a href={link} className="font-medium text-ivory underline underline-offset-4" rel="noopener noreferrer">
              {linkLabel}
            </a>
          )}
        </>
      ) : null}
    </div>
  );
}
