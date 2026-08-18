import { useState } from "react";
import { CalendarDays, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  STATUSES,
  priorityClass,
  useUpdateTask,
  type Task,
  type TaskStatus,
} from "@/lib/tasks";

export function KanbanBoard({
  tasks,
  onOpenTask,
}: {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}) {
  const updateTask = useUpdateTask();
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATUSES.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver((s) => (s === status ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData("text/task-id") || draggingId;
              if (id) updateTask.mutate({ id, patch: { status } });
            }}
            className={`flex min-h-64 flex-col rounded-2xl border bg-surface/60 p-3 transition-colors ${
              dragOver === status ? "drop-target" : ""
            }`}
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold tracking-wide uppercase">{status}</h2>
              <Badge variant="secondary">{columnTasks.length}</Badge>
            </header>

            <div className="flex flex-1 flex-col gap-2">
              {columnTasks.map((task) => {
                const doneCount = task.subtasks.filter((s) => s.done).length;
                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/task-id", task.id);
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => onOpenTask(task)}
                    className="cursor-pointer rounded-xl border bg-card p-3 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
                  >
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${priorityClass(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                      {task.due_date ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {task.due_date}
                        </span>
                      ) : null}
                      {task.subtasks.length ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <ListChecks className="h-3 w-3" />
                          {doneCount}/{task.subtasks.length}
                        </span>
                      ) : null}
                    </div>
                    {task.tags.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {!columnTasks.length ? (
                <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                  Drop tasks here
                </p>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
