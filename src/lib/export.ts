import type { Task } from "@/lib/tasks";

const COLUMNS = ["Title", "Status", "Priority", "Due date", "Tags", "Subtasks", "Description"];

function row(task: Task): string[] {
  const done = task.subtasks.filter((s) => s.done).length;
  return [
    task.title,
    task.status,
    task.priority,
    task.due_date ?? "",
    task.tags.join(", "),
    task.subtasks.length ? `${done}/${task.subtasks.length}` : "",
    task.description,
  ];
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportTasksToCsv(tasks: Task[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [COLUMNS, ...tasks.map(row)].map((cells) => cells.map(escape).join(","));
  // BOM keeps accents correct when opened in Excel.
  download(
    new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }),
    `flowdesk-tasks-${stamp()}.csv`,
  );
}

export async function exportTasksToPdf(tasks: Task[]) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text("Flowdesk tasks", 40, 40);
  doc.setFontSize(10);
  doc.text(`${tasks.length} task(s) • exported ${stamp()}`, 40, 58);

  autoTable(doc, {
    head: [COLUMNS],
    body: tasks.map(row),
    startY: 74,
    styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
    headStyles: { fillColor: [17, 94, 89], textColor: 255 },
    columnStyles: { 0: { cellWidth: 150 }, 6: { cellWidth: 200 } },
  });

  doc.save(`flowdesk-tasks-${stamp()}.pdf`);
}
