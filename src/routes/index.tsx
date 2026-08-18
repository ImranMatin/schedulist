import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckSquare, Columns3, Sparkles, Table2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flowdesk — Kanban, Table & Calendar Task Manager" },
      {
        name: "description",
        content:
          "Flowdesk is a private task workspace with kanban board, inline-editable table, calendar scheduling, smart filters and AI task breakdown.",
      },
      { property: "og:title", content: "Flowdesk — Kanban, Table & Calendar Task Manager" },
      {
        property: "og:description",
        content:
          "Plan work your way: drag-and-drop kanban, spreadsheet editing, calendar rescheduling and AI-assisted task creation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Columns3, title: "Kanban board", body: "Drag cards between To Do, In Progress, Review and Done." },
  { icon: Table2, title: "Spreadsheet view", body: "Sort, search and edit every cell inline with instant saving." },
  { icon: CalendarDays, title: "Calendar", body: "See due dates on a month grid and drag to reschedule." },
  { icon: Sparkles, title: "AI assist", body: "Type a sentence to create a task, or auto-generate subtasks." },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-primary">
          <CheckSquare className="h-6 w-6" />
          <span className="font-display text-xl font-bold tracking-tight">Flowdesk</span>
        </div>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
        <p className="text-sm font-medium tracking-widest text-primary uppercase">Task management</p>
        <h1 className="mt-4 text-4xl font-bold text-balance sm:text-6xl">
          One workspace. Three ways to see your work.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Flowdesk keeps your tasks in sync across a kanban board, an editable table and a
          calendar — private to your account, always.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Get started free</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <feature.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-lg font-semibold">{feature.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
