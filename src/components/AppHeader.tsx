import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckSquare,
  Columns3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  LogOut,
  Moon,
  Search,
  Sun,
  Table2,
} from "lucide-react";
import { toast } from "sonner";
import { exportTasksToCsv, exportTasksToPdf } from "@/lib/export";
import type { Task } from "@/lib/tasks";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "@/lib/theme";
import { PRIORITIES, STATUSES, type Filters, type TaskPriority, type TaskStatus } from "@/lib/tasks";

export type ViewKey = "kanban" | "table" | "calendar";

const VIEWS: Array<{ key: ViewKey; label: string; icon: typeof Columns3 }> = [
  { key: "kanban", label: "Kanban", icon: Columns3 },
  { key: "table", label: "Table", icon: Table2 },
  { key: "calendar", label: "Calendar", icon: CalendarDays },
];

export function AppHeader({
  view,
  onViewChange,
  filters,
  onFiltersChange,
  allTags,
  email,
  exportTasks,
}: {
  view: ViewKey;
  onViewChange: (view: ViewKey) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  allTags: string[];
  email: string;
  exportTasks: Task[];
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const activeFilterCount =
    filters.statuses.length + filters.priorities.length + filters.tags.length;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  async function handleExport(kind: "csv" | "pdf") {
    if (!exportTasks.length) {
      toast.info("There are no tasks to export yet");
      return;
    }
    try {
      if (kind === "csv") exportTasksToCsv(exportTasks);
      else await exportTasksToPdf(exportTasks);
      toast.success(`Downloaded ${exportTasks.length} task(s)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
  }

  function toggleValue<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2 text-primary">
          <CheckSquare className="h-5 w-5" />
          <span className="font-display text-lg font-bold tracking-tight">Flowdesk</span>
        </div>

        <nav className="flex items-center gap-1 rounded-xl bg-surface p-1">
          {VIEWS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onViewChange(item.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === item.key
                  ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="relative min-w-48 flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            placeholder="Search tasks, descriptions, tags…"
            className="pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount ? <Badge variant="secondary">{activeFilterCount}</Badge> : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-4" align="end">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide uppercase">Status</p>
              {STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-2 py-1 text-sm">
                  <Checkbox
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={() =>
                      onFiltersChange({
                        ...filters,
                        statuses: toggleValue<TaskStatus>(filters.statuses, status),
                      })
                    }
                  />
                  {status}
                </label>
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide uppercase">Priority</p>
              {PRIORITIES.map((priority) => (
                <label key={priority} className="flex items-center gap-2 py-1 text-sm">
                  <Checkbox
                    checked={filters.priorities.includes(priority)}
                    onCheckedChange={() =>
                      onFiltersChange({
                        ...filters,
                        priorities: toggleValue<TaskPriority>(filters.priorities, priority),
                      })
                    }
                  />
                  {priority}
                </label>
              ))}
            </div>
            {allTags.length ? (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide uppercase">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        onFiltersChange({ ...filters, tags: toggleValue(filters.tags, tag) })
                      }
                    >
                      <Badge variant={filters.tags.includes(tag) ? "default" : "outline"}>
                        {tag}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {activeFilterCount ? (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() =>
                  onFiltersChange({ search: filters.search, statuses: [], priorities: [], tags: [] })
                }
              >
                Clear filters
              </Button>
            ) : null}
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="max-w-44 truncate">
              {email}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
