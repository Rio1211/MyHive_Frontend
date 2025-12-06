import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

export default function AddEmployeePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    employeeId: "",
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
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        employeeId: form.employeeId,
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
        password: form.password,
        email: form.email.trim(),
        role: "user",
      };

      await axios.post(`${API_BASE_URL}/api/employee/add`, payload, {
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Add New Employee</h2>
            <p className="text-sm text-gray-600">Fill in the basic, position and emergency contact information of the employees.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              ← Back to Dashboard
            </button>

            <button
              type="submit"
              form="add-employee-form"
              disabled={submitting}
              className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          id="add-employee-form"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white px-7 py-6 md:px-8 md:py-8"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Employee ID" name="employeeId" required placeholder="Unique employee number" value={form.employeeId} onChange={handleChange} />
            <Field label="Initial Password" name="password" type="password" required placeholder="Set the initial password for employees" value={form.password} onChange={handleChange} />

            <Field label="First Name" name="firstName" required placeholder="Enter first name" value={form.firstName} onChange={handleChange} />
            <Field label="Last Name" name="lastName" required placeholder="Enter last name" value={form.lastName} onChange={handleChange} />

            <Field label="Social Insurance Number" name="sin" required placeholder="9 digits" value={form.sin} onChange={handleChange} />
            <Field label="Date of Birth" name="dob" type="date" required value={form.dob} onChange={handleChange} />

            <Field label="Phone Number" name="phone" required placeholder="10 digits" value={form.phone} onChange={handleChange} />
            <Field label="Email Address" name="email" type="email" required placeholder="Enter email address" value={form.email} onChange={handleChange} />

            <Field label="Home Address" name="address" required placeholder="Enter home address" value={form.address} onChange={handleChange} />
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
                <option value="" disabled>
                  Select department
                </option>
                <option>Sales</option>
                <option>HR</option>
                <option>Engineering</option>
                <option>Finance</option>
                <option>Operations</option>
              </select>
            </label>

            <Field label="Job Title" name="jobTitle" required placeholder="Enter job title" value={form.jobTitle} onChange={handleChange} />
            <Field label="Annual Salary" name="salary" required placeholder="Enter annual salary" value={form.salary} onChange={handleChange} />

            <Field label="Manager" name="manager" required placeholder="Enter manager name" value={form.manager} onChange={handleChange} />
            <Field
              label="Emergency Contact Phone Number"
              name="emergencyPhone"
              required
              placeholder="Enter emergency contact phone number"
              value={form.emergencyPhone}
              onChange={handleChange}
            />

            <Field
              label="Emergency Contact"
              name="emergencyName"
              required
              placeholder="Enter emergency contact name"
              value={form.emergencyName}
              onChange={handleChange}
            />
          </div>
        </form>
      </div>
    </HRPageShell>
  );
}
