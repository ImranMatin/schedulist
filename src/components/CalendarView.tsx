import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { priorityClass, useUpdateTask, type Task } from "@/lib/tasks";

export function CalendarView({
  tasks,
  onOpenTask,
}: {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}) {
  const updateTask = useUpdateTask();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [dragOver, setDragOver] = useState<string | null>(null);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const list = map.get(task.due_date) ?? [];
      list.push(task);
      map.set(task.due_date, list);
    }
    return map;
  }, [tasks]);

  const unscheduled = tasks.filter((task) => !task.due_date);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">{format(month, "MMMM yyyy")}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-7 bg-surface text-xs font-semibold tracking-wide uppercase">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="px-2 py-2 text-center text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = byDate.get(key) ?? [];
            return (
              <div
                key={key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(key);
                }}
                onDragLeave={() => setDragOver((d) => (d === key ? null : d))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const id = e.dataTransfer.getData("text/task-id");
                  if (id) updateTask.mutate({ id, patch: { due_date: key } });
                }}
                className={`min-h-28 border-t border-l p-1.5 first:border-l-0 ${
                  isSameMonth(day, month) ? "" : "bg-surface/40 text-muted-foreground"
                } ${dragOver === key ? "drop-target" : ""}`}
              >
                <div
                  className={`mb-1 text-xs font-medium ${
                    isToday(day)
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
                      onClick={() => onOpenTask(task)}
                      className={`block w-full truncate rounded-md border px-1.5 py-1 text-left text-[11px] ${priorityClass(task.priority)}`}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {unscheduled.length ? (
        <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="mb-2 text-sm font-semibold">Unscheduled — drag onto a day</h3>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((task) => (
              <button
                key={task.id}
                type="button"
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
                onClick={() => onOpenTask(task)}
                className={`rounded-lg border px-2 py-1 text-xs ${priorityClass(task.priority)}`}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
