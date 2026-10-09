/**
 * Emails for team accounts: a password reset, and the "set your password" link
 * a new team member (or the owner, at first-time setup) receives. Plain wording,
 * the link, how long it lasts, and what to do if it was not expected.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type TeamEmail = { subject: string; html: string; text: string };

export function buildPasswordEmail(opts: {
  kind: "reset" | "invite";
  name: string | null;
  url: string;
  minutes: number;
}): TeamEmail {
  const greeting = opts.name ? `Hello ${opts.name},` : "Hello,";
  const lasts = `The link works once and lasts ${opts.minutes} minutes.`;
  const subject =
    opts.kind === "invite"
      ? "Set your password for the Tourism Is Life team desk"
      : "Reset your Tourism Is Life team password";
  const lead =
    opts.kind === "invite"
      ? "A team account has been set up for you on the Tourism Is Life operations desk. Choose your password here:"
      : "Someone asked to reset the password for your Tourism Is Life team account. Choose a new password here:";
  const after =
    opts.kind === "invite"
      ? "After that you will set up two-factor sign-in with an authenticator app on your phone."
      : "Your other signed-in sessions end when the new password is saved.";
  const ignore =
    opts.kind === "invite"
      ? "If you were not expecting this, you can ignore this email."
      : "If you did not ask for this, ignore this email; your password stays as it is.";
  const text = [greeting, "", lead, opts.url, "", lasts, after, "", ignore, "", "Tourism Is Life, Freetown"].join("\n");
  const html = `<p>${escapeHtml(greeting)}</p>
<p>${escapeHtml(lead)}</p>
<p><a href="${escapeHtml(opts.url)}">${escapeHtml(opts.kind === "invite" ? "Set your password" : "Reset your password")}</a></p>
<p>${escapeHtml(lasts)} ${escapeHtml(after)}</p>
<p>${escapeHtml(ignore)}</p>
<p>Tourism Is Life, Freetown</p>`;
  return { subject, html, text };
}
