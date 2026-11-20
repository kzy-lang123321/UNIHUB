export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((ch === "\r" || ch === "\n") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some((v) => v)) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("Unclosed quote in CSV.");
  row.push(field.trim());
  if (row.some((v) => v)) rows.push(row);
  return rows;
}
