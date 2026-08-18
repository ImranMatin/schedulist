import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Maximize2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORITIES,
  STATUSES,
  priorityClass,
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";

type SortKey = "title" | "status" | "priority" | "due_date" | "created_at";

const PRIORITY_ORDER: Record<TaskPriority, number> = { Low: 0, Medium: 1, High: 2, Urgent: 3 };
const STATUS_ORDER: Record<TaskStatus, number> = {
  "To Do": 0,
  "In Progress": 1,
  Review: 2,
  Done: 3,
};

export function TableView({
  tasks,
  onOpenTask,
}: {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTask = useCreateTask();

  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  const sorted = useMemo(() => {
    const rows = [...tasks];
    rows.sort((a, b) => {
      let diff = 0;
      if (sortKey === "priority") diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      else if (sortKey === "status") diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      else diff = String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""));
      return sortAsc ? diff : -diff;
    });
    return rows;
  }, [tasks, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const header = (key: SortKey, label: string) => (
    <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className="inline-flex items-center gap-1 transition-colors hover:text-primary"
      >
        {label}
        {sortKey === key ? (
          sortAsc ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : null}
      </button>
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-[var(--shadow-card)]">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead className="bg-surface text-muted-foreground">
          <tr>
            {header("title", "Title")}
            {header("status", "Status")}
            {header("priority", "Priority")}
            {header("due_date", "Due")}
            <th className="px-3 py-2 text-left text-xs font-semibold tracking-wide uppercase">
              Tags
            </th>
            <th className="w-24 px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => (
            <tr key={task.id} className="border-t transition-colors hover:bg-surface/60">
              <td className="px-2 py-1">
                <Input
                  defaultValue={task.title}
                  key={`${task.id}-${task.title}`}
                  onBlur={(e) => {
                    if (e.target.value !== task.title)
                      updateTask.mutate({ id: task.id, patch: { title: e.target.value } });
                  }}
                  className="border-0 bg-transparent shadow-none focus-visible:bg-background focus-visible:ring-1"
                />
              </td>
              <td className="px-2 py-1">
                <Select
                  value={task.status}
                  onValueChange={(v) =>
                    updateTask.mutate({ id: task.id, patch: { status: v as TaskStatus } })
                  }
                >
                  <SelectTrigger className="border-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-2 py-1">
                <Select
                  value={task.priority}
                  onValueChange={(v) =>
                    updateTask.mutate({ id: task.id, patch: { priority: v as TaskPriority } })
                  }
                >
                  <SelectTrigger
                    className={`border shadow-none ${priorityClass(task.priority)} w-32`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="px-2 py-1">
                <Input
                  type="date"
                  value={task.due_date ?? ""}
                  onChange={(e) =>
                    updateTask.mutate({
                      id: task.id,
                      patch: { due_date: e.target.value || null },
                    })
                  }
                  className="w-40 border-0 bg-transparent shadow-none focus-visible:bg-background focus-visible:ring-1"
                />
              </td>
              <td className="px-2 py-1">
                <Input
                  key={`${task.id}-${task.tags.join(",")}`}
                  defaultValue={task.tags.join(", ")}
                  placeholder="tag, tag"
                  onBlur={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((t) => t.trim().toLowerCase())
                      .filter(Boolean);
                    if (tags.join(",") !== task.tags.join(","))
                      updateTask.mutate({ id: task.id, patch: { tags } });
                  }}
                  className="border-0 bg-transparent shadow-none focus-visible:bg-background focus-visible:ring-1"
                />
              </td>
              <td className="px-2 py-1 text-right whitespace-nowrap">
                <Button size="icon" variant="ghost" onClick={() => onOpenTask(task)}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteTask.mutate(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}

          <tr className="border-t bg-surface/50">
            <td className="px-2 py-1" colSpan={5}>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) {
                    createTask.mutate({ title: newTitle.trim() });
                    setNewTitle("");
                  }
                }}
                placeholder="+ Add task and press Enter…"
                className="border-0 bg-transparent shadow-none"
              />
            </td>
            <td className="px-2 py-1 text-right">
              <Button
                size="icon"
                variant="ghost"
                disabled={!newTitle.trim()}
                onClick={() => {
                  createTask.mutate({ title: newTitle.trim() });
                  setNewTitle("");
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
