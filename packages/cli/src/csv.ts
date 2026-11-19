/** Minimal RFC 4180 CSV reader/writer (quoted fields, embedded separators and line breaks). */

export function detectDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0] && counts[0][1] > 0 ? counts[0][0] : ",";
}

export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

export function toCsv(rows: string[][], delimiter: string): string {
  const esc = (v: string) => (/[",;\t\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return rows.map((r) => r.map(esc).join(delimiter)).join("\n") + "\n";
}

const EMAIL_HEADERS = /^(e-?mail|email ?address|mail|courriel|address)$/i;

/** Index of the email column: by header name, then by content. Returns { index, hasHeader }. */
export function findEmailColumn(rows: string[][], wanted?: string): { index: number; hasHeader: boolean } {
  const header = rows[0] ?? [];
  if (wanted) {
    const byName = header.findIndex((h) => h.trim().toLowerCase() === wanted.toLowerCase());
    if (byName >= 0) return { index: byName, hasHeader: true };
    const n = Number(wanted);
    if (Number.isInteger(n) && n >= 1) return { index: n - 1, hasHeader: !header.some((h) => h.includes("@")) };
    throw new Error(`Column "${wanted}" not found. Available: ${header.join(", ")}`);
  }
  const byHeader = header.findIndex((h) => EMAIL_HEADERS.test(h.trim()));
  if (byHeader >= 0) return { index: byHeader, hasHeader: true };
  const sample = rows.slice(0, 20);
  let best = -1;
  let bestHits = 0;
  for (let col = 0; col < Math.max(...sample.map((r) => r.length)); col++) {
    const hits = sample.filter((r) => (r[col] ?? "").includes("@")).length;
    if (hits > bestHits) [best, bestHits] = [col, hits];
  }
  if (best < 0) throw new Error("No email column found. Use --column <name|number>.");
  return { index: best, hasHeader: !(header[best] ?? "").includes("@") };
}
