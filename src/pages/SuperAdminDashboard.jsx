import React, { useState, useEffect } from "react";
import axios from "axios";
import Logo from "../assets/logo.png";

function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "admin",
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", email: "", role: "admin" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5233";

  // Fetch current user profile and admin list
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user profile
        const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        setCurrentUser({
          name: profileResponse.data.user.email.split("@")[0],
          role: profileResponse.data.user.role === "admin" ? "HR Admin" : "Other",
          initials: profileResponse.data.user.email.substring(0, 2).toUpperCase(),
        });

        // Get admin list
        const adminsResponse = await axios.get(`${API_BASE_URL}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        
        setAdmins(adminsResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/users`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      
      setAdmins((prev) => [...prev, response.data]);
      setFormData({ name: "", email: "", role: "admin" });
      setShowAddForm(false);
    } catch (err) {
      console.error("Error creating admin:", err);
      alert("Failed to create admin user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this admin user?")) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    } catch (err) {
      console.error("Error deleting admin:", err);
      alert("Failed to delete admin user");
    }
  };

  const handleOpenEdit = (admin) => {
    setEditForm({
      id: admin.id,
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role && admin.role.toLowerCase().includes("admin") ? "admin" : "hr",
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
      const res = await axios.put(
        `${API_BASE_URL}/api/admin/users/${editForm.id}`,
        { name: editForm.name, email: editForm.email, role: editForm.role },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAdmins((prev) =>
        prev.map((a) => (a.id === editForm.id ? { ...a, ...res.data } : a))
      );
      setEditModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to update admin";
      setEditError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const getRandomColorClass = (index) => {
    const colors = [
      "bg-purple-600",
      "bg-amber-400",
      "bg-blue-500",
      "bg-green-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="MyHive Logo" className="h-9 w-auto" />
        </div>

        <div className="relative flex items-center gap-3 text-sm">
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-slate-800 font-medium">{currentUser.name}</p>
            <p className="text-xs text-slate-600">{currentUser.role}</p>
          </div>

          <button
            onClick={() => setIsUserMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold cursor-pointer"
            aria-label="Open user menu"
          >
            {currentUser.initials}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 font-semibold"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-10 py-10">
        {/* Page Title */}
        <section className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-left">
            Admin Dashboard
          </h1>
        </section>

        {/* Tabs */}
        <section className="mb-8">
          <div className="inline-flex items-center bg-slate-100 rounded-full p-1 gap-1">
            {["Overview", "Manage Admins"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs sm:text-sm rounded-full font-medium transition ${
                  activeTab === tab
                    ? "bg-white border border-slate-300"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        {/* Loading and Error States */}
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

        {/* Overview Tab */}
        {activeTab === "Overview" && !loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-lg mb-2">System Status</h2>
              <p className="text-slate-600">All systems operational</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-lg mb-2">User Statistics</h2>
              <p className="text-slate-600">{admins.length} admin users</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-lg mb-2">Recent Activity</h2>
              <p className="text-slate-600">No recent activity</p>
            </div>
          </div>
        )}

        {/* Manage Admins Tab */}
        {activeTab === "Manage Admins" && !loading && !error && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold">Manage Admins</h2>
                <p className="text-sm text-slate-600">
                  Add, remove, or edit admin accounts
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800"
              >
                {showAddForm ? "Cancel" : "+ Add New"}
              </button>
            </div>

            {/* Add Admin Form */}
            {showAddForm && (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl border border-slate-200 p-6 mb-6"
              >
                <h3 className="font-semibold text-lg mb-4">Add New Admin</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                    >
                      <option value="admin">HR Admin</option>
                      <option value="hr">HR Manager</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800"
                  >
                    Add Admin
                  </button>
                </div>
              </form>
            )}

            {/* Admin List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">
                      Admin
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">
                      Email
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-slate-700">
                      Role
                    </th>
                    <th className="text-right py-3 px-6 text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin, index) => (
                    <tr key={admin.id} className="border-b border-slate-100">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${getRandomColorClass(
                              index
                            )}`}
                          >
                            {admin.initials}
                          </div>
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-slate-600">{admin.email}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                          {admin.role}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(admin)}
                            className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="px-3 py-2 text-xs font-semibold text-white rounded-lg"
                            style={{ backgroundColor: "#DC2626" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {editModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Edit Admin</h3>
                <p className="text-sm text-slate-600">Update name, email, or role</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-800 text-sm font-semibold">
                Close
              </button>
            </div>

            {editError && <div className="mb-3 text-sm text-red-600">{editError}</div>}

            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
                Full Name
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
                Email Address
                <input
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="text-sm font-medium text-slate-800 flex flex-col gap-2">
                Role
                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="admin">HR Admin</option>
                  <option value="hr">HR Manager</option>
                </select>
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
                style={{ backgroundColor: "#111827", opacity: savingEdit ? 0.7 : 1 }}
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

export default SuperAdminDashboard;
