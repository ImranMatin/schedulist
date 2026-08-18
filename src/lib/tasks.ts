import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const STATUSES = ["To Do", "In Progress", "Review", "Done"] as const;
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export type TaskStatus = (typeof STATUSES)[number];
export type TaskPriority = (typeof PRIORITIES)[number];

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
  subtasks: Subtask[];
  position: number;
  created_at: string;
}

const TASKS_KEY = ["tasks"] as const;

function normalize(row: Record<string, unknown>): Task {
  return {
    ...(row as unknown as Task),
    tags: Array.isArray(row["tags"]) ? (row["tags"] as string[]) : [],
    subtasks: Array.isArray(row["subtasks"]) ? (row["subtasks"] as Subtask[]) : [],
  };
}

export function useTasks() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => normalize(row as Record<string, unknown>));
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Task>) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          title: input.title ?? "Untitled task",
          description: input.description ?? "",
          status: input.status ?? "To Do",
          priority: input.priority ?? "Medium",
          due_date: input.due_date ?? null,
          tags: input.tags ?? [],
          subtasks: input.subtasks ?? [],
          position: input.position ?? Date.now(),
        } as never)
        .select("*")
        .single();
      if (error) throw error;
      return normalize(data as Record<string, unknown>);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const { error } = await supabase.from("tasks").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const previous = queryClient.getQueryData<Task[]>(TASKS_KEY);
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(TASKS_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export interface Filters {
  search: string;
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  tags: string[];
}

export function filterTasks(tasks: Task[], filters: Filters): Task[] {
  const q = filters.search.trim().toLowerCase();
  return tasks.filter((task) => {
    if (q) {
      const haystack = [task.title, task.description, ...task.tags].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.statuses.length && !filters.statuses.includes(task.status)) return false;
    if (filters.priorities.length && !filters.priorities.includes(task.priority)) return false;
    if (filters.tags.length && !filters.tags.some((tag) => task.tags.includes(tag))) return false;
    return true;
  });
}

export function priorityClass(priority: TaskPriority): string {
  switch (priority) {
    case "Urgent":
      return "bg-urgent/15 text-urgent border-urgent/30";
    case "High":
      return "bg-high/15 text-high border-high/30";
    case "Medium":
      return "bg-medium/15 text-medium border-medium/30";
    default:
      return "bg-low/15 text-low border-low/30";
  }
}
