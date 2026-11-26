/**
 * Safely renders FAQ plain text and simple Markdown-style tables.
 * Admin-entered content stays text; no HTML interpretation or dangerouslySetInnerHTML.
 */
type TextBlock = { type: "text"; text: string };
type TableBlock = { type: "table"; headers: string[]; rows: string[][] };
type Block = TextBlock | TableBlock;

function splitCells(line: string): string[] {
  let value = line.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|") && !value.endsWith("\\|")) value = value.slice(0, -1);

  const cells: string[] = [];
  let current = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "\\" && value[i + 1] === "|") {
      current += "|";
      i++;
    } else if (value[i] === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += value[i];
    }
  }
  cells.push(current.trim());
  return cells;
}

function isTableSeparator(line: string, columns: number): boolean {
  const cells = splitCells(line);
  return (
    cells.length === columns &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")))
  );
}

function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  const textLines: string[] = [];

  function flushText() {
    const text = textLines.join("\n").trim();
    if (text) blocks.push({ type: "text", text });
    textLines.length = 0;
  }

  let i = 0;
  while (i < lines.length) {
    const headers = splitCells(lines[i]);
    const isTable =
      i + 1 < lines.length &&
      lines[i].includes("|") &&
      headers.length >= 2 &&
      isTableSeparator(lines[i + 1], headers.length);

    if (!isTable) {
      textLines.push(lines[i]);
      i++;
      continue;
    }

    flushText();
    i += 2; // Skip header and separator lines.
    const rows: string[][] = [];
    while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
      const cells = splitCells(lines[i]);
      if (cells.length !== headers.length) break;
      rows.push(cells);
      i++;
    }
    blocks.push({ type: "table", headers, rows });
  }
  flushText();
  return blocks;
}

export default function FaqAnswer({ body }: { body: string }) {
  const blocks = parseBlocks(body);

  return (
    <div className="max-w-full">
      {blocks.map((block, index) =>
        block.type === "text" ? (
          <p
            key={`text-${index}`}
            className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-[#b4b2ab]"
          >
            {block.text}
          </p>
        ) : (
          <div
            key={`table-${index}`}
            className="mt-4 max-w-full overflow-x-auto rounded-lg border border-[#E28906]/25"
          >
            <table className="w-full min-w-[480px] border-collapse text-left text-sm leading-6">
              <thead className="bg-[#E28906]/10 text-[#FAF9F6]">
                <tr>
                  {block.headers.map((header, column) => (
                    <th
                      key={column}
                      scope="col"
                      className="border-b border-r border-white/10 px-4 py-3 font-semibold last:border-r-0"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-white/10 last:border-b-0">
                    {row.map((cell, column) => (
                      <td
                        key={column}
                        className="border-r border-white/10 px-4 py-3 align-top text-[#b4b2ab] last:border-r-0"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </div>
  );
}
