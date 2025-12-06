import { useMemo, useState, useEffect } from "react";
import axios from "axios";
function Pill({ children, tone = "default", className = "" }) {
  const tones = {
    default: "bg-gray-100 text-gray-800 border border-gray-200",
    counter: "bg-gray-100 text-gray-700",
    pending: "bg-red-200/80 text-red-800",
    progress: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    done: "bg-green-100 text-green-700",
    tag: "bg-white text-gray-800 border border-gray-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

function CalendarChip({ children }) {
  return (
    <div className="text-sm text-gray-600 flex items-center gap-2">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 bg-white">
        📅
      </span>
      <span>{children}</span>
    </div>
  );
}

function CompleteButton({ disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition
        ${
          disabled
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
    >
      <span className="text-base leading-none">✓</span>
      Mark Complete
    </button>
  );
}

/* Task Card */
function TaskCard({ t, onStatusChange, onDelete }) {
  const statusTone = t.status === "completed" ? "done" : t.status === "in-progress" ? "progress" : "pending";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-7 py-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="text-lg font-semibold">{t.employee}</div>
        <Pill tone={statusTone}>{t.status}</Pill>
      </div>

      {/* Meta */}
      <div className="mt-3 flex items-center gap-3 text-sm">
        <Pill tone="tag">{t.department}</Pill>
        <span className="h-1 w-1 rounded-full bg-violet-500" />
        <span className="text-gray-700">{t.title}</span>
      </div>

      {/* task bar */}
      <div className="mt-4 w-full rounded-[10px] bg-[#E9E2E2] px-4 py-3 text-sm text-gray-700 select-none">
        {t.task}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <CalendarChip>Due: {t.due}</CalendarChip>
        <div className="flex items-center gap-2">
          <select
            className="rounded-full border px-3 py-2 text-xs"
            value={t.status}
            onChange={(e) => onStatusChange(t.id, e.target.value)}
          >
            <option value="pending">pending</option>
            <option value="in-progress">in-progress</option>
            <option value="completed">completed</option>
          </select>
          <button
            type="button"
            onClick={() => onDelete(t.id)}
            className="rounded-full border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
          <CompleteButton
            disabled={t.status === "completed"}
            onClick={() => onStatusChange(t.id, "completed")}
          />
        </div>
      </div>
    </article>
  );
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5233";

/* Page */
export default function OnboardingPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", task: "", dueDate: "" });
  const [employees, setEmployees] = useState([]);

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const formatTask = (t) => {
    let empData = t.employee;
    if (empData && typeof empData === "string") {
      empData = employees.find((e) => e._id === empData) || { _id: empData };
    }
    const emp = empData || {};
    return {
      id: t._id,
      employee:
        [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
        emp.name ||
        "Unassigned",
      title: t.jobTitle || emp.jobTitle || "-",
      department: t.department || emp.department || "-",
      due: t.dueDate
        ? new Date(t.dueDate).toISOString().split("T")[0]
        : "-",
      status: t.status,
      task: t.task,
    };
  };

  const fetchEmployees = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/employee`, { headers });
    setEmployees(res.data?.employees || []);
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_BASE_URL}/api/onboarding`, { headers });
      setRows((res.data?.tasks || []).map(formatTask));
      setPage(1);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load onboarding tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees().catch(() => {});
    fetchTasks();
  }, []);

  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const progressCount = rows.filter((r) => r.status === "in-progress").length;
  const doneCount = rows.filter((r) => r.status === "completed").length;

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const slice = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page]
  );

  async function updateStatus(id, status) {
    try {
      await axios.patch(
        `${API_BASE_URL}/api/onboarding/${id}/status`,
        { status },
        { headers }
      );
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update status");
    }
  }

  async function deleteTask(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/onboarding/${id}`, { headers });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to delete task");
    }
  }

  async function addTask(e) {
    e.preventDefault();
    if (!form.employeeId || !form.task || !form.dueDate) {
      setError("Please fill employee, task, and due date");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/onboarding`,
        {
          employeeId: form.employeeId,
          task: form.task,
          dueDate: form.dueDate,
        },
        { headers }
      );
      const newRow = formatTask(res.data?.task || res.data);
      setRows((prev) => [newRow, ...prev]);
      setForm({ employeeId: "", task: "", dueDate: "" });
      setFormOpen(false);
      setPage(1);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to add task");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold">Onboarding Tasks</h2>
          <p className="text-sm text-gray-600">
            Track new employee onboarding progress
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Pill tone="counter">{pendingCount} pending</Pill>
          <Pill tone="counter">{progressCount} in-progress</Pill>
          <Pill tone="counter">{doneCount} completed</Pill>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {formOpen ? "Close" : "Add Task"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={addTask}
          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-gray-700">
              Employee
              <select
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.employeeId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, employeeId: e.target.value }))
                }
                required
              >
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {[e.firstName, e.lastName].filter(Boolean).join(" ") ||
                      e.employeeId ||
                      e._id}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-gray-700">
              Task
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.task}
                onChange={(e) =>
                  setForm((f) => ({ ...f, task: e.target.value }))
                }
                placeholder="e.g. Complete IT setup"
                required
              />
            </label>

            <label className="text-sm text-gray-700">
              Due Date
              <input
                type="date"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDate: e.target.value }))
                }
                required
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Create Task
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading tasks...
        </div>
      ) : (
        <>

      {/* Cards */}
      <div className="space-y-6">
            {slice.map((t) => (
              <TaskCard
                key={t.id}
                t={t}
                onStatusChange={updateStatus}
                onDelete={deleteTask}
              />
            ))}
            {!slice.length && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
                No onboarding tasks yet.
              </div>
            )}
          </div>

      {/* Pagination */}
      <div className="flex items-center pt-6 text-xs text-slate-600">
            <div className="w-20" />
            <div className="flex-1 text-center opacity-80">
              Page {page} - {pages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-default"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-default"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next <span>{">"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
