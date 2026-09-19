# TaskFlow AI

Build a full-stack, responsive task management system connected to a Supabase backend with full authentication and user data isolation.

1. Authentication & Security (Supabase Auth):

   - Implement Supabase Auth with Email and Password signup/login forms.

   - Include a smooth auth state flow: redirect unauthenticated users to the Login/Signup page, and authenticated users to the main dashboard.

   - Add a User Profile menu in the top navbar showing the logged-in user's email and a "Sign Out" button.

   - Create a `tasks` database table with fields: id, user_id (linked to auth.users), title, description, status (To Do, In Progress, Review, Done), priority (Low, Medium, High, Urgent), due_date, tags (array of strings), subtasks (JSON list of subtasks), and created_at.

   - Configure Supabase Row Level Security (RLS) policies on the `tasks` table so users can ONLY view, create, update, and delete their OWN tasks.

2. Views & Navigation:

   - Provide a top navigation bar with a view switcher between:

     - Kanban Board (interactive drag-and-drop columns matching task statuses).

     - Spreadsheet / Table View (sortable, searchable data grid with direct inline cell editing for title, status, priority, and due dates).

     - Calendar View (monthly calendar mapping tasks by due date with drag-to-reschedule capability).

   - Both views must read from and write to the exact same Supabase `tasks` table in real time for the authenticated user.

3. Interactive Spreadsheet Editing:

   - All cells in Spreadsheet View must be fully editable inline.

   - Editing a cell auto-saves instantly to Supabase and updates the Kanban board simultaneously.

   - Include an "+ Add Task" row at the bottom of the table for quick inline entry.

4. Filtering & Search:

   - Global search bar to filter tasks instantly across views.

   - Multi-variable filtering by priority, status, and custom tags.

   - Dark/Light mode toggle in the header.

5. Task Details Modal & Subtasks:

   - Clicking any task card or spreadsheet row opens a detailed modal.

   - Supports title, rich-text description, due date picker, priority selector, and subtask checklist with progress bar.

6. Smart AI Features:

   - "Smart Task Creation" input bar that accepts natural language (e.g., "Review API pull request by tomorrow at 3pm urgent") and parses title, priority, and due date automatically.

   - "AI Breakdown" button inside the task modal that generates 3-5 suggested subtasks using an LLM API call.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://schedulist.lovable.app/

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cf15a069-225c-4526-9fe3-eeef5b729770).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
