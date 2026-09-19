import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader, type ViewKey } from "@/components/AppHeader";
import { KanbanBoard } from "@/components/KanbanBoard";
import { TableView } from "@/components/TableView";
import { CalendarView } from "@/components/CalendarView";
import { TaskModal } from "@/components/TaskModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseNaturalTask } from "@/lib/ai.functions";
import {
  filterTasks,
  useCreateTask,
  useTasks,
  type Filters,
  type Task,
  type TaskPriority,
} from "@/lib/tasks";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Flowdesk Task Manager" },
      {
        name: "description",
        content:
          "Your private Flowdesk workspace: kanban board, editable table and calendar for every task.",
      },
      { property: "og:title", content: "Dashboard — Flowdesk Task Manager" },
      {
        property: "og:description",
        content: "Manage tasks across kanban, table and calendar views in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data: tasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const parseTask = useServerFn(parseNaturalTask);

  const [view, setView] = useState<ViewKey>("kanban");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    statuses: [],
    priorities: [],
    tags: [],
  });
  const [smartInput, setSmartInput] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const allTags = useMemo(
    () => [...new Set(tasks.flatMap((task) => task.tags))].sort(),
    [tasks],
  );
  const visible = useMemo(() => filterTasks(tasks, filters), [tasks, filters]);
  const openTask = tasks.find((task) => task.id === openTaskId) ?? null;

  async function handleSmartCreate() {
    const text = smartInput.trim();
    if (!text) return;
    setSmartLoading(true);
    try {
      const parsed = await parseTask({
        data: { text, today: new Date().toISOString().slice(0, 10) },
      });
      await createTask.mutateAsync({
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority as TaskPriority,
        due_date: parsed.due_date,
        tags: parsed.tags,
      });
      setSmartInput("");
      toast.success(`Created "${parsed.title}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the task");
    } finally {
      setSmartLoading(false);
    }
  }

  const handleOpenTask = (task: Task) => setOpenTaskId(task.id);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        view={view}
        onViewChange={setView}
        filters={filters}
        onFiltersChange={setFilters}
        allTags={allTags}
        email={user.email ?? "Account"}
        exportTasks={visible}
      />

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6">
        <section className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Sparkles className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSmartCreate();
                }}
                placeholder='Smart create: "Review API pull request by tomorrow at 3pm urgent"'
                className="pl-9"
              />
            </div>
            <Button onClick={handleSmartCreate} disabled={smartLoading || !smartInput.trim()}>
              {smartLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add task
            </Button>
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : view === "kanban" ? (
          <KanbanBoard tasks={visible} onOpenTask={handleOpenTask} />
        ) : view === "table" ? (
          <TableView tasks={visible} onOpenTask={handleOpenTask} />
        ) : (
          <CalendarView tasks={visible} onOpenTask={handleOpenTask} />
        )}
      </main>

      <TaskModal
        task={openTask}
        open={Boolean(openTask)}
        onOpenChange={(open) => {
          if (!open) setOpenTaskId(null);
        }}
      />
    </div>
  );
}
