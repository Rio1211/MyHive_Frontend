import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { HRPageShell } from "./HRDashboard";

function Field({ label, name, type = "text", placeholder, required, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-3 w-full rounded-[10px] bg-[#F3F4F7] px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 outline-none ring-1 ring-inset ring-gray-200 focus:ring-gray-300"
      />
    </label>
  );
}

export default function EditEmployeePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    sin: "",
    dob: "",
    email: "",
    phone: "",
    hireDate: "",
    address: "",
    jobTitle: "",
    department: "",
    manager: "",
    salary: "",
    emergencyName: "",
    emergencyPhone: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmp = async () => {
      setError("");
      setLoading(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5233";
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/employee/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const e = res.data?.employee || {};
        setForm({
          firstName: e.firstName || "",
          lastName: e.lastName || "",
          sin: e.sinNumber || "",
          dob: e.dob ? e.dob.slice(0, 10) : "",
          email: e.emailAddress || "",
          phone: e.phoneNumber || "",
          hireDate: e.hireDate ? e.hireDate.slice(0, 10) : "",
          address: e.homeAddress || "",
          jobTitle: e.jobTitle || "",
          department: e.department || "",
          manager: e.manager || "",
          salary: e.salary ?? "",
          emergencyName: e.emergencyContact || "",
          emergencyPhone: e.emergencyContactPhone || "",
        });
      } catch (err) {
        const msg = err?.response?.data?.error || "Employee details cannot be obtained";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchEmp();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5233";
      const token = localStorage.getItem("token");

      const sinDigits = form.sin.replace(/\D/g, "");
      const phoneDigits = form.phone.replace(/\D/g, "");
      const emergencyPhoneDigits = form.emergencyPhone.replace(/\D/g, "");

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        sinNumber: sinDigits,
        dob: form.dob,
        phoneNumber: phoneDigits,
        emailAddress: form.email.trim(),
        homeAddress: form.address,
        hireDate: form.hireDate,
        department: form.department,
        jobTitle: form.jobTitle,
        manager: form.manager,
        salary: Number(form.salary),
        emergencyContact: form.emergencyName,
        emergencyContactPhone: emergencyPhoneDigits,
      };

      await axios.put(`${API_BASE_URL}/api/employee/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("save successfully");
      navigate("/hr-dashboard");
    } catch (err) {
      const msg = err?.response?.data?.error || "Submission failed. Please try again later";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HRPageShell>
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Edit Employee</h2>
            <p className="text-sm text-gray-600">Update the personal/job/emergency contact information of employees.</p>
          </div>
          <button
            type="submit"
            form="edit-employee-form"
            disabled={submitting}
            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>

        {loading && <div className="text-sm text-gray-600">Loading...</div>}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && (
          <form
            id="edit-employee-form"
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white px-7 py-6 md:px-8 md:py-8"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="First Name" name="firstName" required value={form.firstName} onChange={handleChange} placeholder="Enter first name" />
              <Field label="Last Name" name="lastName" required value={form.lastName} onChange={handleChange} placeholder="Enter last name" />

              <Field label="Social Insurance Number" name="sin" required value={form.sin} onChange={handleChange} placeholder="9 digits" />
              <Field label="Date of Birth" name="dob" type="date" required value={form.dob} onChange={handleChange} />

              <Field label="Phone Number" name="phone" required value={form.phone} onChange={handleChange} placeholder="10 digits" />
              <Field label="Email Address" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="name@company.com" />

              <Field label="Home Address" name="address" required value={form.address} onChange={handleChange} placeholder="Enter home address" />
              <Field label="Hire Date" name="hireDate" type="date" required value={form.hireDate} onChange={handleChange} />

              <label className="block">
                <span className="text-sm font-medium text-gray-900">
                  Department <span className="text-red-500">*</span>
                </span>
                <select
                  name="department"
                  required
                  value={form.department}
                  onChange={handleChange}
                  className="mt-3 w-full rounded-[10px] bg-[#F3F4F7] px-4 py-2.5 text-sm text-gray-900 outline-none ring-1 ring-inset ring-gray-200 focus:ring-gray-300"
                >
                  <option value="" disabled>Select department</option>
                  <option>Sales</option>
                  <option>HR</option>
                  <option>Engineering</option>
                  <option>Finance</option>
                  <option>Operations</option>
                </select>
              </label>

              <Field label="Job Title" name="jobTitle" required value={form.jobTitle} onChange={handleChange} placeholder="Enter job title" />
              <Field label="Annual Salary" name="salary" required value={form.salary} onChange={handleChange} placeholder="Enter annual salary" />

              <Field label="Manager" name="manager" required value={form.manager} onChange={handleChange} placeholder="Enter manager name" />
              <Field
                label="Emergency Contact Phone Number"
                name="emergencyPhone"
                required
                value={form.emergencyPhone}
                onChange={handleChange}
                placeholder="10 digits"
              />

              <Field
                label="Emergency Contact"
                name="emergencyName"
                required
                value={form.emergencyName}
                onChange={handleChange}
                placeholder="Enter emergency contact name"
              />
            </div>
          </form>
        )}
      </div>
    </HRPageShell>
  );
}
