import test from "node:test";
import assert from "node:assert/strict";
import { csvNumber, MAX_CSV_ROWS, parseCsv, safeSpreadsheetCell } from "./csv.ts";

test("CSV đọc BOM, dấu phẩy, dấu nháy và ô xuống dòng", () => {
  const result = parseCsv('\uFEFFTên,Giá,Ghi chú\r\n"Áo, polo",50.000,"Dòng 1\nDòng 2"\r\n"Có ""nháy""",12,OK');
  assert.deepEqual(result.errors, []);
  assert.equal(result.records.length, 3);
  assert.deepEqual(result.records[1].cells, ["Áo, polo", "50.000", "Dòng 1\nDòng 2"]);
  assert.equal(result.records[2].cells[0], 'Có "nháy"');
});

test("CSV báo dấu nháy thiếu và giới hạn số dòng", () => {
  assert.match(parseCsv('Tên\n"chưa đóng').errors[0], /thiếu dấu nháy/);
  const tooMany = `Tên\n${Array.from({ length: MAX_CSV_ROWS + 1 }, (_, index) => `sp${index}`).join("\n")}`;
  assert.match(parseCsv(tooMany).errors.at(-1) ?? "", /tối đa/);
});

test("đọc số Việt Nam và chặn formula injection khi xuất bảng tính", () => {
  assert.equal(csvNumber("1.234.567"), 1234567);
  assert.equal(csvNumber("12,5"), 12.5);
  assert.equal(csvNumber("không phải số"), null);
  for (const value of ["=1+1", "+cmd", "-2+3", "@SUM(A1)"]) assert.equal(String(safeSpreadsheetCell(value)).startsWith("'"), true);
  assert.equal(safeSpreadsheetCell("Áo polo"), "Áo polo");
});
