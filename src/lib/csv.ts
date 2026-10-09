/**
 * CSV for spreadsheets (task A12). Every cell is quoted, and a cell a
 * spreadsheet would run as a formula (starting with =, +, -, @, a tab or a
 * carriage return) gets a leading apostrophe, so an enquiry typed as
 * "=HYPERLINK(...)" opens as text, never as a formula.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
