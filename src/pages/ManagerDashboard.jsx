import React, { useState, useEffect } from "react";
import axios from "axios";
import Logo from "../assets/logo.png";

function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentManager, setCurrentManager] = useState({});
  const [stats, setStats] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [importantDates, setImportantDates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    emailAddress: "",
    phoneNumber: "",
    department: "",
    manager: "",
    emergencyContact: "",
    emergencyContactPhone: "",
  });
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (window.location.origin.includes("5173")
      ? window.location.origin.replace("5173", "5233")
      : window.location.origin);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

        const managerResponse = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
          headers: authHeaders,
        });
        const profileUser = managerResponse.data?.user || {};
        setCurrentManager({
          name: profileUser.name || profileUser.email?.split("@")[0] || "Manager",
          role: profileUser.role || "Manager",
          initials: (profileUser.name || profileUser.email || "M").slice(0, 2).toUpperCase(),
        });

        const statsResponse = await axios.get(`${API_BASE_URL}/api/manager/stats`, {
          headers: authHeaders,
        });
        setStats(statsResponse.data);

        const activityResponse = await axios.get(`${API_BASE_URL}/api/manager/activity`, {
          headers: authHeaders,
        });
        setRecentActivity(activityResponse.data);

        const datesResponse = await axios.get(`${API_BASE_URL}/api/manager/important-dates`, {
          headers: authHeaders,
        });
        setImportantDates(datesResponse.data);

        const employeesResponse = await axios.get(`${API_BASE_URL}/api/manager/employees`, {
          headers: authHeaders,
        });
        setEmployees(employeesResponse.data);

        const leaveRequestsResponse = await axios.get(`${API_BASE_URL}/api/manager/leave-requests`, {
          headers: authHeaders,
        });
        setLeaveRequests(leaveRequestsResponse.data);
      } catch (err) {
        console.error("Failed to obtain data:", err);
        setError("Failed to obtain the data. Please try again later");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [API_BASE_URL]);

  const handleApproveLeave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/manager/leave-requests/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setLeaveRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: res.data.status } : req)));
    } catch (err) {
      console.error("Failed to approve the leave request", err);
      alert("The approval of the leave request failed. Please try again");
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_BASE_URL}/api/manager/leave-requests/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setLeaveRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status: res.data.status } : req)));
    } catch (err) {
      console.error("Failed to reject the leave request", err);
      alert("The request for leave was rejected failed. Please try again");
    }
  };

  const handleOpenEdit = (emp) => {
    const [firstName = "", lastName = ""] = (emp.name || "").split(" ");
    setEditForm({
      id: emp.id,
      firstName,
      lastName,
      jobTitle: emp.role || "",
      emailAddress: emp.email || "",
      phoneNumber: emp.phone || "",
      department: emp.department || "",
      manager: emp.manager || "",
      emergencyContact: emp.emergencyName || "",
      emergencyContactPhone: emp.emergencyPhone || "",
    });
    setEditError("");
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    setEditError("");
    setSavingEdit(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : {};

      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        jobTitle: editForm.jobTitle,
        emailAddress: editForm.emailAddress,
        phoneNumber: editForm.phoneNumber,
        department: editForm.department,
        manager: editForm.manager,
        emergencyContact: editForm.emergencyContact,
        emergencyContactPhone: editForm.emergencyContactPhone,
      };

      await axios.put(`${API_BASE_URL}/api/employee/${editForm.id}`, payload, { headers });

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editForm.id
            ? {
                ...emp,
                name: `${editForm.firstName} ${editForm.lastName}`.trim(),
                role: editForm.jobTitle,
                email: editForm.emailAddress,
                phone: editForm.phoneNumber,
                department: editForm.department,
                manager: editForm.manager,
                emergencyName: editForm.emergencyContact,
                emergencyPhone: editForm.emergencyContactPhone,
              }
            : emp
        )
      );

      setEditModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to save changes. Please try again.";
      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const getRandomColorClass = (index) => {
    const colors = ["bg-purple-600", "bg-amber-400", "bg-blue-500", "bg-green-500", "bg-pink-500", "bg-indigo-500"];
    return colors[index % colors.length];
  };

  const filteredEmployees = employees.filter(
    (emp) => emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="MyHive Logo" className="h-9 w-auto" />
        </div>

        <div className="relative flex items-center gap-3 text-sm">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-slate-800 font-medium">{currentManager.name}</p>
            <p className="text-xs text-slate-600">{currentManager.role}</p>
          </div>

          <button
            onClick={() => setIsUserMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold cursor-pointer"
            aria-label="Open user menu"
          >
            {currentManager.initials}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden z-50">
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 font-semibold">
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 w-full px-10 py-10">
        <section className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-left">Manager Dashboard</h1>
        </section>

        <section className="mb-8">
          <div className="inline-flex items-center bg-slate-100 rounded-full p-1 gap-1">
            {["Overview", "Employees", "Leave Requests"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs sm:text-sm rounded-full font-medium transition ${
                  activeTab === tab ? "bg-white border border-slate-300" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        {loading && (
          <div className="text-center py-8">
            <p>Loading...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {activeTab === "Overview" && !loading && !error && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 px-6 py-6 flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-slate-700">{s.label}</p>
                  <p className="text-2xl font-semibold mt-2">{s.value}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[260px]">
                <h2 className="font-semibold text-sm mb-1">Recent Activity</h2>
                <p className="text-xs text-slate-600 mb-4">Here are the latest updates in your organization</p>
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-0.5 text-[10px] font-medium text-slate-800">
                        {item.tag}
                      </span>
                      <p className="text-sm text-slate-800">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[260px]">
                <h2 className="font-semibold text-sm mb-4">Upcoming Important Dates</h2>
                <div className="space-y-3">
                  {importantDates.map((d) => (
                    <div key={d.id} className="flex items-start gap-3">
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-0.5 text-[10px] font-medium text-slate-800">
                        {d.tag}
                      </span>
                      <p className="text-sm text-slate-800">{d.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "Employees" && !loading && !error && (
          <div className="w-full">
            <section className="mb-4">
              <h2 className="text-lg font-semibold">Employee Management</h2>
              <p className="text-sm text-slate-600">See your direct reports</p>
            </section>

            <div className="mb-6">
              <div className="flex items-center bg-white border border-slate-300 rounded-full px-4 py-2 gap-3">
                <span className="text-slate-500 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search employee by name or email address"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-6">
              {filteredEmployees.map((emp, index) => (
                <div key={emp.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-lg ${getRandomColorClass(index)}`}>
                        {emp.initials || emp.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold">{emp.name}</p>
                        <p className="text-sm text-slate-600">{emp.role}</p>
                        <div className="mt-3">
                          <p className="text-xs font-semibold">Contact Information:</p>
                          <p className="text-xs text-slate-600">Email Address: {emp.email}</p>
                          <p className="text-xs text-slate-600">Phone: {emp.phone}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-semibold">Emergency Contact:</p>
                          <p className="text-xs text-slate-600">Name: {emp.emergencyName}</p>
                          <p className="text-xs text-slate-600">Phone: {emp.emergencyPhone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start lg:items-end gap-2 text-sm text-slate-700">
                      <p>Manager: {emp.manager}</p>
                      <p>Department: {emp.department}</p>
                      <p>Hire Date: {emp.hireDate}</p>
                      <span className={`mt-2 px-4 py-1 rounded-full text-xs font-medium border ${emp.status === "Active" ? "border-black text-black" : "border-slate-500 text-slate-700"}`}>
                        {emp.status}
                      </span>
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="mt-2 px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-8 text-xs text-slate-600">
              <p>Page 1–2</p>
              <button className="flex items-center gap-1 hover:text-slate-900">Next</button>
            </div>
          </div>
        )}

        {activeTab === "Leave Requests" && !loading && !error && (
          <div className="w-full">
            <section className="mb-4">
              <h2 className="text-lg font-semibold"> Leave Requests</h2>
              <p className="text-sm text-slate-600">Review and manage employee leave requests</p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaveRequests.map((req) => (
                <article key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between min-h-[180px]">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-base">{req.name}</p>
                      <p className="text-sm text-slate-600 mt-1">{req.type}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-md text-[10px] font-semibold ${
                        req.status === "Pending"
                          ? "bg-slate-300 text-slate-700"
                          : req.status === "Approved"
                          ? "bg-black text-white"
                          : "bg-red-300 text-red-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-xs text-slate-700 mt-3">
                    <div>
                      <p className="font-semibold">Start Date</p>
                      <p className="text-slate-600 mt-1">{req.startDate}</p>
                    </div>
                    <div>
                      <p className="font-semibold">End Date</p>
                      <p className="text-slate-600 mt-1">{req.endDate}</p>
                    </div>
                  </div>

                  {req.status === "Pending" && (
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                      <button
                        onClick={() => handleApproveLeave(req.id)}
                        className="w-full sm:w-auto text-center bg-green-700 text-white text-xs px-4 py-2 rounded-md hover:bg-green-800"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectLeave(req.id)}
                        className="w-full sm:w-auto text-center bg-red-700 text-white text-xs px-4 py-2 rounded-md hover:bg-red-800"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </section>
          </div>
        )}
      </main>

      {editModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Edit Employee</h3>
                <p className="text-sm text-slate-600">Update basic information and contacts</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-800 text-sm font-semibold">
                Close
              </button>
            </div>

            {editError && <div className="mb-3 text-sm text-red-600">{editError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <input
                  name="department"
                  value={editForm.department}
                  onChange={handleEditChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
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
                Email
                <input
                  name="emailAddress"
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
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 text-sm font-semibold text-white rounded-lg"
                style={{ backgroundColor: "#5F4B8B", opacity: savingEdit ? 0.7 : 1 }}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
