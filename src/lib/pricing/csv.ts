export const MAX_CSV_BYTES = 2 * 1024 * 1024;
export const MAX_CSV_ROWS = 1_000;

export type CsvRecord = { cells: string[]; line: number };
export type CsvParseResult = { records: CsvRecord[]; errors: string[] };

export function parseCsv(text: string): CsvParseResult {
  if (new TextEncoder().encode(text).byteLength > MAX_CSV_BYTES) return { records: [], errors: ["File CSV vượt quá 2 MB."] };
  const source = text.replace(/^\uFEFF/, "");
  const records: CsvRecord[] = []; const errors: string[] = [];
  let cells: string[] = []; let cell = ""; let quoted = false; let line = 1; let recordLine = 1;
  const pushCell = () => { cells.push(cell.trim()); cell = ""; };
  const pushRecord = () => {
    pushCell();
    if (cells.some(Boolean)) records.push({ cells, line: recordLine });
    cells = []; recordLine = line + 1;
  };
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index++; }
      else if (!quoted && cell.length === 0) quoted = true;
      else if (quoted) quoted = false;
      else errors.push(`Dòng ${line}: dấu nháy không hợp lệ.`);
    } else if (char === "," && !quoted) pushCell();
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[index + 1] === "\n") index++;
      pushRecord(); line++;
      if (records.length > MAX_CSV_ROWS + 1) return { records: records.slice(0, MAX_CSV_ROWS + 1), errors: [...errors, `CSV chỉ hỗ trợ tối đa ${MAX_CSV_ROWS} dòng dữ liệu.`] };
    } else { cell += char; if (char === "\n") line++; }
  }
  if (quoted) errors.push(`Dòng ${recordLine}: thiếu dấu nháy đóng.`);
  if (cell.length || cells.length) pushRecord();
  if (records.length > MAX_CSV_ROWS + 1) errors.push(`CSV chỉ hỗ trợ tối đa ${MAX_CSV_ROWS} dòng dữ liệu.`);
  return { records, errors };
}

export function csvNumber(value: string) {
  const normalized = value.trim().replace(/\s/g, "");
  if (!normalized) return null;
  const plain = normalized.includes(",") && normalized.includes(".")
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized.replace(/(?<=\d)[.,](?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const number = Number(plain);
  return Number.isFinite(number) ? number : null;
}

export function safeSpreadsheetCell(value: unknown) {
  if (typeof value !== "string") return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function safeSpreadsheetRows<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safeSpreadsheetCell(value)])));
}
