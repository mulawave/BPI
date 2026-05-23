"use client";

type TableColumn = {
  key?: string;
  label?: string;
};

type TableRow = Record<string, unknown>;

export default function TableBlockRenderer({ block }: { block: Record<string, unknown> }) {
  const columns = Array.isArray(block.columns) ? (block.columns as TableColumn[]) : [];
  const rows = Array.isArray(block.rows) ? (block.rows as TableRow[]) : [];

  if (!columns.length) {
    return <div className="rounded-xl border border-dashed border-border bg-background/30 p-3 text-xs text-muted-foreground">Table block has no columns.</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/40">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-[hsl(var(--muted))/0.45]">
            <tr>
              {columns.map((column, index) => (
                <th key={`${column.key || "col"}-${index}`} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {column.label || column.key || `Col ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.length ? rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {columns.map((column, colIndex) => (
                  <td key={`${rowIndex}-${column.key || colIndex}`} className="px-3 py-2 text-xs text-foreground">
                    {column.key ? String(row[column.key] ?? "-") : "-"}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-3 py-3 text-xs text-muted-foreground" colSpan={columns.length}>No table rows declared.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
