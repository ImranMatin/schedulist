import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { breakdownTask } from "@/lib/ai.functions";
import {
  PRIORITIES,
  STATUSES,
  useDeleteTask,
  useUpdateTask,
  type Subtask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks";

export function TaskModal({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const runBreakdown = useServerFn(breakdownTask);

  const [draft, setDraft] = useState<Task | null>(task);
  const [newSubtask, setNewSubtask] = useState("");
  const [newTag, setNewTag] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => setDraft(task), [task]);

  if (!draft) return null;

  const save = (patch: Partial<Task>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    updateTask.mutate({ id: draft.id, patch });
  };

  const done = draft.subtasks.filter((s) => s.done).length;
  const progress = draft.subtasks.length ? (done / draft.subtasks.length) * 100 : 0;

  const setSubtasks = (subtasks: Subtask[]) => save({ subtasks });

  const addSubtask = (title: string) => {
    if (!title.trim()) return;
    setSubtasks([
      ...draft.subtasks,
      { id: crypto.randomUUID(), title: title.trim(), done: false },
    ]);
    setNewSubtask("");
  };

  async function handleAiBreakdown() {
    if (!draft) return;
    setAiLoading(true);
    try {
      const result = await runBreakdown({
        data: { title: draft.title, description: draft.description },
      });
      const generated: Subtask[] = result.subtasks.map((title) => ({
        id: crypto.randomUUID(),
        title,
        done: false,
      }));
      save({ subtasks: [...draft.subtasks, ...generated] });
      toast.success(`Added ${generated.length} suggested subtasks`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI breakdown failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Task details</DialogTitle>
        </DialogHeader>

        <Input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          onBlur={(e) => save({ title: e.target.value })}
          className="h-auto border-0 px-0 font-display !text-2xl font-bold shadow-none focus-visible:ring-0"
          placeholder="Task title"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={draft.status} onValueChange={(v) => save({ status: v as TaskStatus })}>
              <SelectTrigger>
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
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={draft.priority}
              onValueChange={(v) => save({ priority: v as TaskPriority })}
            >
              <SelectTrigger>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Due date</Label>
            <Input
              id="due"
              type="date"
              value={draft.due_date ?? ""}
              onChange={(e) => save({ due_date: e.target.value || null })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={5}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            onBlur={(e) => save({ description: e.target.value })}
            placeholder="Add context, links, acceptance criteria…"
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap items-center gap-2">
            {draft.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => save({ tags: draft.tags.filter((t) => t !== tag) })}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTag.trim()) {
                  e.preventDefault();
                  save({ tags: [...new Set([...draft.tags, newTag.trim().toLowerCase()])] });
                  setNewTag("");
                }
              }}
              placeholder="Add tag…"
              className="h-8 w-32"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>
              Subtasks{" "}
              <span className="text-muted-foreground">
                ({done}/{draft.subtasks.length})
              </span>
            </Label>
            <Button size="sm" variant="outline" onClick={handleAiBreakdown} disabled={aiLoading}>
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI Breakdown
            </Button>
          </div>
          <Progress value={progress} />
          <ul className="space-y-2">
            {draft.subtasks.map((subtask) => (
              <li key={subtask.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Checkbox
                  checked={subtask.done}
                  onCheckedChange={(checked) =>
                    setSubtasks(
                      draft.subtasks.map((s) =>
                        s.id === subtask.id ? { ...s, done: checked === true } : s,
                      ),
                    )
                  }
                />
                <span
                  className={
                    subtask.done ? "flex-1 text-sm line-through opacity-60" : "flex-1 text-sm"
                  }
                >
                  {subtask.title}
                </span>
                <button
                  type="button"
                  aria-label="Delete subtask"
                  onClick={() => setSubtasks(draft.subtasks.filter((s) => s.id !== subtask.id))}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSubtask(newSubtask);
                }
              }}
              placeholder="Add a subtask…"
            />
            <Button variant="secondary" onClick={() => addSubtask(newSubtask)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-between border-t pt-4">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              deleteTask.mutate(draft.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete task
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
