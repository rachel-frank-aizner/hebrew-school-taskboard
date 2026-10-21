import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "לוח משימות צוות בית הספר" },
      { name: "description", content: "מערכת לניהול משימות לצוות בית הספר: הוספה, מעקב ושינוי סטטוס." },
      { property: "og:title", content: "לוח משימות צוות בית הספר" },
      { property: "og:description", content: "ניהול משימות פשוט וברור לצוות החינוכי." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Task = { id: string; title: string; owner: string; due: string; done: boolean };
type Filter = "all" | "open" | "done";
const KEY = "school-tasks-v1";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  const today = new Date().toISOString().slice(0, 10);
  const openCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.length - openCount;

  const visible = useMemo(
    () =>
      tasks
        .filter((t) => (filter === "all" ? true : filter === "open" ? !t.done : t.done))
        .sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due)),
    [tasks, filter],
  );

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !owner.trim() || !due) {
      setError("יש למלא כותרת, אחראי ותאריך יעד");
      return;
    }
    setTasks((p) => [...p, { id: crypto.randomUUID(), title: title.trim(), owner: owner.trim(), due, done: false }]);
    setTitle("");
    setOwner("");
    setDue("");
    setError("");
  }

  const toggle = (id: string) => setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm font-medium opacity-80">צוות בית הספר</p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight">לוח משימות</h1>
          <div className="mt-6 grid grid-cols-3 gap-3 max-w-md">
            <Stat label="סה״כ" value={tasks.length} />
            <Stat label="פתוחות" value={openCount} />
            <Stat label="הושלמו" value={doneCount} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 grid gap-8 lg:grid-cols-[340px_1fr]">
        <form onSubmit={add} className="h-fit rounded-xl border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-lg font-bold">משימה חדשה</h2>
          <Field label="כותרת המשימה">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: הכנת מבחן מתמטיקה" />
          </Field>
          <Field label="שם האחראי">
            <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="לדוגמה: רונית כהן" />
          </Field>
          <Field label="תאריך יעד">
            <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground transition hover:opacity-90">
            הוספת משימה
          </button>
        </form>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-bold">רשימת המשימות</h2>
            <div className="flex rounded-lg border bg-card p-1 text-sm">
              {([["all", "הכל"], ["open", "פתוחות"], ["done", "הושלמו"]] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`rounded-md px-4 py-1.5 font-medium transition ${filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-12 text-center text-muted-foreground">
              אין משימות להצגה. הוסיפו משימה חדשה בטופס.
            </div>
          ) : (
            <ul className="space-y-3">
              {visible.map((t) => {
                const late = !t.done && t.due < today;
                return (
                  <li key={t.id} className={`flex items-center gap-4 rounded-xl border bg-card p-4 shadow-soft transition ${t.done ? "opacity-70" : ""}`}>
                    <div className={`h-12 w-1.5 rounded-full ${t.done ? "bg-success" : late ? "bg-destructive" : "bg-accent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        אחראי/ת: <span className="text-foreground">{t.owner}</span> · יעד:{" "}
                        <span className={late ? "font-semibold text-destructive" : "text-foreground"}>{formatDate(t.due)}</span>
                        {late && " (באיחור)"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggle(t.id)}
                      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${t.done ? "bg-success/15 text-success" : "bg-accent/15 text-accent-foreground"}`}
                      title="לחצו לשינוי סטטוס"
                    >
                      {t.done ? "✓ הושלמה" : "פתוחה"}
                    </button>
                    <button onClick={() => remove(t.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="מחיקה">
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-primary-foreground/10 px-4 py-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
