import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ── helpers ── */
function initials(fullName = "") {
  const parts = fullName.trim().split(/\s+/);
  return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase();
}

function colorFromName(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h} 55% 65%)`;
}

function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.49 21.49 20l-5.99-6zM9.5 14C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
      />
    </svg>
  );
}

function IconEdit(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92L13.06 8.5l.92.92L5.92 19.58zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      />
    </svg>
  );
}

function StatusPill({ value }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md bg-black px-5 py-1 text-xs font-medium text-white">
      {value}
    </span>
  );
}

function EmployeeCard({ emp, onEdit }) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 px-7 py-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16">
        <div className="flex gap-4 lg:flex-[2]">
          <div
            className="mt-1 flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold text-white"
            style={{ background: colorFromName(emp.name) }}
          >
            {initials(emp.name)}
          </div>

          <div>
            <div className="text-base font-semibold leading-snug">
              {emp.name}
            </div>
            <div className="text-sm text-slate-600">{emp.title}</div>

            <div className="mt-4 space-y-1 text-xs">
              <div className="font-semibold">Contact Information:</div>
              <div className="text-slate-600">Email Address: {emp.email}</div>
              <div className="text-slate-600">Phone: {emp.phone}</div>
            </div>

            <div className="mt-4 space-y-1 text-xs">
              <div className="font-semibold">Emergency Contact:</div>
              <div className="text-slate-600">Name: {emp.emergency.name}</div>
              <div className="text-slate-600">Phone: {emp.emergency.phone}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-700 lg:flex-[1]">
          <div>
            <div>Manager: {emp.manager}</div>
            <div>Department: {emp.department}</div>
            <div>Hire Date: {emp.hireDate}</div>
          </div>

          <div className="pt-3">
            <StatusPill value={emp.status} />
          </div>
        </div>

        <button
          type="button"
          aria-label={`Edit ${emp.name}`}
          onClick={onEdit}
          className="self-start rounded-md p-1 text-slate-500 hover:bg-slate-100"
        >
          <IconEdit />
        </button>
      </div>
    </article>
  );
}

/* ── page component ── */
export default function HREmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    id: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    department: "",
    manager: "",
    emailAddress: "",
    phoneNumber: "",
    emergencyContact: "",
    emergencyContactPhone: "",
    salary: "",
  });

  const pageSize = 3;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5233";

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/employee`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const list = res.data?.employees || [];
        setEmployees(list);
      } catch (err) {
        const msg = err?.response?.data?.error || "The list of employees cannot be obtained";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const departmentOptions = ["Sales", "HR", "Engineering", "Finance", "Operations"];

  const normalized = useMemo(
    () =>
      employees.map((e) => ({
        id: e._id || e.employeeId,
        name: `${e.firstName || ""} ${e.lastName || ""}`.trim() || e.employeeId,
        title: e.jobTitle || "N/A",
        email: e.emailAddress || "",
        phone: e.phoneNumber || "",
        manager: e.manager || "N/A",
        department: e.department || "N/A",
        hireDate: e.hireDate ? e.hireDate.slice(0, 10) : "N/A",
        status: "Active",
        emergency: {
          name: e.emergencyContact || "N/A",
          phone: e.emergencyContactPhone || "N/A",
        },
      })),
    [employees]
  );

  const filtered = useMemo(() => {
    const v = q.trim().toLowerCase();
    if (!v) return normalized;
    return normalized.filter(
      (e) =>
        e.name.toLowerCase().includes(v) ||
        e.email.toLowerCase().includes(v)
    );
  }, [q, normalized]);

  const handleOpenEdit = (id) => {
    const raw = employees.find((e) => (e._id || e.employeeId) === id);
    if (!raw) return;
    setEditForm({
      id: raw._id || raw.employeeId || "",
      firstName: raw.firstName || "",
      lastName: raw.lastName || "",
      jobTitle: raw.jobTitle || "",
      department: raw.department || "",
      manager: raw.manager || "",
      emailAddress: raw.emailAddress || "",
      phoneNumber: raw.phoneNumber || "",
      emergencyContact: raw.emergencyContact || "",
      emergencyContactPhone: raw.emergencyContactPhone || "",
      salary: raw.salary ?? "",
    });
    setEditError("");
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editForm.id) return;
    setSavingEdit(true);
    setEditError("");
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        jobTitle: editForm.jobTitle,
        department: editForm.department,
        manager: editForm.manager,
        emailAddress: editForm.emailAddress,
        phoneNumber: editForm.phoneNumber,
        emergencyContact: editForm.emergencyContact,
        emergencyContactPhone: editForm.emergencyContactPhone,
        salary: editForm.salary !== "" ? Number(editForm.salary) : undefined,
      };
      await axios.put(`${API_BASE_URL}/api/employee/${editForm.id}`, payload, { headers });

      setEmployees((prev) =>
        prev.map((e) =>
          (e._id || e.employeeId) === editForm.id
            ? {
                ...e,
                ...payload,
              }
            : e
        )
      );
      setEditOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save changes. Please try again.";
      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const startIndex = (pageClamped - 1) * pageSize;
  const slice = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Employee Management</h2>
          <p className="text-sm text-gray-600">View and manage employee information</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/hr/add-employee")}
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Add New Employee
        </button>
      </div>

      <div className="rounded-[12px] border border-gray-200 bg-white/70 p-2 pl-3">
        <div className="flex items-center gap-3 rounded-[8px] bg-gray-100 px-3 py-2">
          <IconSearch className="text-gray-500" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
            placeholder="Search employees by name or email address"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading && <div className="text-sm text-gray-600">Loading...</div>}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="space-y-4">
            {slice.map((emp) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                onEdit={() => handleOpenEdit(emp.id)}
              />
            ))}

            {slice.length === 0 && (
              <div className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
                No employees match "{q}"
              </div>
            )}
          </div>

          <div className="flex items-center pt-6 text-xs text-slate-600">
            <div className="w-20" />
            <div className="flex-1 text-center opacity-80">
              Page {pageClamped} - {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-default"
                disabled={pageClamped <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-default"
                disabled={pageClamped >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <span>→</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>

    {editOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">
        <div className="w-full max-w-3xl rounded-2xl bg-white p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sticky top-0 z-10 bg-white pb-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Edit Employee</h3>
              <p className="text-sm text-slate-600">Update basic information and emergency contacts</p>
            </div>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          {editError && <div className="mb-3 text-sm text-red-600">{editError}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              First Name
              <input
                name="firstName"
                value={editForm.firstName}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Last Name
              <input
                name="lastName"
                value={editForm.lastName}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Job Title
              <input
                name="jobTitle"
                value={editForm.jobTitle}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Department
              <select
                name="department"
                value={editForm.department}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200 bg-white"
              >
                <option value="">Select department</option>
                {departmentOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Manager
              <input
                name="manager"
                value={editForm.manager}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Annual Salary
              <input
                name="salary"
                type="number"
                min="0"
                step="1000"
                value={editForm.salary}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Email
              <input
                name="emailAddress"
                type="email"
                value={editForm.emailAddress}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Phone
              <input
                name="phoneNumber"
                value={editForm.phoneNumber}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Emergency Contact
              <input
                name="emergencyContact"
                value={editForm.emergencyContact}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
              Emergency Phone
              <input
                name="emergencyContactPhone"
                value={editForm.emergencyContactPhone}
                onChange={handleEditChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

            <div className="flex flex-wrap justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-50"
              >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={savingEdit}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg"
              style={{ backgroundColor: "#111827", opacity: savingEdit ? 0.7 : 1 }}
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
