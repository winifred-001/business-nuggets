
import type { ReactNode } from "react";

type Props = {
  content: string;
};

function getCells(line: string): string[] {
  let value = line.trim();

  if (value.startsWith("|")) {
    value = value.slice(1);
  }

  if (value.endsWith("|")) {
    value = value.slice(0, -1);
  }

  return value.split("|").map((cell) => cell.trim());
}

function isTableSeparator(
  line: string,
  columnCount: number,
): boolean {
  if (!line.includes("|")) return false;

  const cells = getCells(line);

  return (
    cells.length === columnCount &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell))
  );
}

export default function FaqContent({ content }: Props) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  const blocks: ReactNode[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    const paragraph = paragraphLines.join("\n").trim();
    paragraphLines = [];

    if (!paragraph) return;

    blocks.push(
      <p
        key={`paragraph-${blocks.length}`}
        className="whitespace-pre-wrap break-words"
      >
        {paragraph}
      </p>,
    );
  }

  let index = 0;

  while (index < lines.length) {
    const currentLine = lines[index];
    const nextLine = lines[index + 1];

    const headers = currentLine.includes("|")
      ? getCells(currentLine)
      : [];

    const isTable =
      headers.length >= 2 &&
      headers.length <= 12 &&
      nextLine !== undefined &&
      isTableSeparator(nextLine, headers.length);

    if (isTable) {
      flushParagraph();

      const rows: string[][] = [];
      index += 2;

      while (index < lines.length) {
        const rowLine = lines[index];

        if (!rowLine.trim() || !rowLine.includes("|")) {
          break;
        }

        const rowCells = getCells(rowLine);

        if (rowCells.length !== headers.length) {
          break;
        }

        rows.push(rowCells);
        index++;
      }

      blocks.push(
        <div
          key={`table-${blocks.length}`}
          className="my-5 max-w-full overflow-x-auto rounded-lg border border-[#E28906]/25"
        >
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead className="bg-[#E28906]/10">
              <tr>
                {headers.map((header, columnIndex) => (
                  <th
                    key={columnIndex}
                    scope="col"
                    className="border-b border-r border-[#E28906]/20 px-4 py-3 font-semibold text-[#E28906] last:border-r-0"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-white/10 last:border-b-0"
                >
                  {row.map((cell, columnIndex) => (
                    <td
                      key={columnIndex}
                      className="break-words border-r border-white/10 px-4 py-3 text-[#b4b2ab] last:border-r-0"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );

      continue;
    }

    if (!currentLine.trim()) {
      flushParagraph();
    } else {
      paragraphLines.push(currentLine);
    }

    index++;
  }

  flushParagraph();

  return (
    <div className="mt-4 max-w-full space-y-4 text-[15px] leading-7 text-[#b4b2ab]">
      {blocks}
    </div>
  );
}
