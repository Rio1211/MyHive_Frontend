import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, User, XCircle, Bell, Calendar, Download, FileText, Home } from 'lucide-react';

// Metric card
const MetricCard = ({ title, value, icon: Icon, iconColor, bgColor }) => (
  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bgColor}`}>
      <Icon className={`w-7 h-7 ${iconColor}`} />
    </div>
  </div>
);

const QuickActionButton = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="w-full sm:w-auto text-center px-5 sm:px-8 py-3 sm:py-4 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
  >
    {children}
  </button>
);

const AnnouncementItem = ({ text, badge }) => {
  const badgeColors = {
    General: 'bg-gray-400',
    Urgent: 'bg-red-500',
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 py-4 border-b border-gray-200 last:border-0">
      <div className="w-1 h-6 sm:h-full bg-blue-500 rounded-full sm:mt-1"></div>
      <p className="flex-1 text-gray-700 text-sm leading-relaxed">{text}</p>
      <span className={`px-3 py-1 rounded-full text-white text-xs font-medium sm:self-start sm:ml-auto ${badgeColors[badge]}`}>
        {badge}
      </span>
    </div>
  );
};

export default function EmployeeDashboard() {
  const [currentView, setCurrentView] = useState('overview'); // overview, request-leave, leave-requests, paystubs, profile, change-password
  const [activeTab, setActiveTab] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Employee', role: 'Employee', jobTitle: '', department: '' });
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [paystubs, setPaystubs] = useState([]);
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const oldPasswordRef = React.useRef(null);
  const newPasswordRef = React.useRef(null);
  const confirmPasswordRef = React.useRef(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' && window.location.origin.includes('5173')
      ? window.location.origin.replace('5173', '5233')
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5233'));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Profile
        try {
          const profileRes = await axios.get(`${API_BASE_URL}/api/auth/profile`, { headers });
          const user = profileRes.data?.user || {};
          setCurrentUser({
            name: user.name || user.email?.split('@')[0] || 'Employee',
            role: user.role || 'Employee',
            jobTitle: '',
            department: '',
            email: user.email,
            id: user.id,
          });

          // Employee details to fill job title/department if available
          try {
            const empRes = await axios.get(`${API_BASE_URL}/api/employee`, { headers });
            const list = empRes.data?.employees || [];
            const match = list.find(
              (e) =>
                e.emailAddress === user.email ||
                (e.userId && (e.userId._id === user.id || e.userId === user.id))
            );
            if (match) {
              const fullEmpName = [match.firstName, match.lastName].filter(Boolean).join(' ');
              setEmployeeInfo(match);
              setCurrentUser((prev) => ({
                ...prev,
                name: fullEmpName || prev.name,
                jobTitle: match.jobTitle || prev.jobTitle,
                department: match.department || prev.department,
              }));
            }
          } catch (empErr) {
            console.error('Failed to load employee info:', empErr);
          }
        } catch (profileErr) {
          console.error('Failed to load profile:', profileErr);
        }

        const leaveResponse = await axios.get(`${API_BASE_URL}/api/employee/leave-requests`, { headers });
        setLeaveRequests(leaveResponse.data);

        const paystubsResponse = await axios.get(`${API_BASE_URL}/api/employee/paystubs`, { headers });
        setPaystubs(paystubsResponse.data);
      } catch (err) {
        console.error('Failed to obtain data:', err);
        setError('Failed to obtain the data. Please try again later');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const handleSubmitLeave = async () => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};

    if (!leaveType || !startDate || !endDate || !reason) {
      alert('Please fill in the complete type of leave, start/end date and reason');
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/employee/leave-requests`,
        {
          leaveType,
          startDate,
          endDate,
          reason,
        },
        { headers }
      );

      if (response.data.success) {
        alert('The leave application has been submitted!');
        const newLeave = response.data.leave
          ? {
              id: response.data.leave._id,
              type: response.data.leave.leaveType,
              startDate: response.data.leave.startDate?.slice(0, 10),
              endDate: response.data.leave.endDate?.slice(0, 10),
              status: response.data.leave.status || 'Pending',
              reason: response.data.leave.reason,
              submittedOn: response.data.leave.appliedAt
                ? new Date(response.data.leave.appliedAt).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
            }
          : null;

        if (newLeave) setLeaveRequests((prev) => [newLeave, ...prev]);

        setLeaveType('');
        setStartDate('');
        setEndDate('');
        setReason('');
        setCurrentView('leave-requests');
      } else {
        alert('submission failed: ' + (response.data.error || response.data.message || 'unknown error'));
      }
    } catch (err) {
      console.error('submission failed:', err);
      alert('Submission failed. Please try again later');
    }
  };

  const handleCancelLeave = () => {
    setLeaveType('');
    setStartDate('');
    setEndDate('');
    setReason('');
    setCurrentView('overview');
  };

  const handleDeleteLeave = async (id) => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      await axios.delete(`${API_BASE_URL}/api/employee/leave-requests/${id}`, { headers });
      setLeaveRequests((prev) => prev.filter((r) => r.id !== id && r._id !== id));
    } catch (err) {
      console.error('delete failed:', err);
      alert('Deletion failed. Please try again later');
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    const oldPassword = oldPasswordRef.current?.value || '';
    const newPassword = newPasswordRef.current?.value || '';
    const confirmPassword = confirmPasswordRef.current?.value || '';

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match.');
      return;
    }

    try {
      setPasswordSaving(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(
        `${API_BASE_URL}/api/setting/change-password`,
        { oldPassword, newPassword },
        { headers }
      );
      setPasswordMessage('Password updated successfully.');
      if (oldPasswordRef.current) oldPasswordRef.current.value = '';
      if (newPasswordRef.current) newPasswordRef.current.value = '';
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = '';
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to change password. Please try again.';
      setPasswordMessage(msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  const pendingCount = useMemo(() => leaveRequests.filter((r) => r.status === 'Pending').length, [leaveRequests]);
  const approvedCount = useMemo(() => leaveRequests.filter((r) => r.status === 'Approved').length, [leaveRequests]);
  const rejectedCount = useMemo(() => leaveRequests.filter((r) => r.status === 'Rejected').length, [leaveRequests]);
  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toISOString().slice(0, 10);
  };

  const formatPhone = (value) => {
    if (!value) return 'N/A';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return value;
  };
  const Header = () => (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/myHive Logo.png"
              alt="Company Logo"
              className="w-12 h-12 rounded-xl object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Portal</h1>
              <p className="text-sm text-gray-600">Welcome Back {currentUser.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">
                {currentUser.jobTitle || currentUser.role}
                {currentUser.department ? ` · ${currentUser.department}` : ''}
              </p>
            </div>
              <div className="relative">
                <button
                  type="button"
                  className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#5F4B8B' }}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Open user menu"
                >
                  <User className="w-6 h-6 text-white" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-14 w-40 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden z-50">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 font-semibold"
                  >
                    Log out
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setCurrentView('profile');
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                  >
                    Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const NavigationTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
      <button
        onClick={() => {
          setCurrentView('overview');
          setActiveTab('Overview');
        }}
        className={`px-4 sm:px-6 py-2 text-sm sm:text-base rounded-full font-medium transition-all ${
          activeTab === 'Overview' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        Overview
      </button>
      <button
        onClick={() => {
          setCurrentView('leave-requests');
          setActiveTab('Leave Requests');
        }}
        className={`px-4 sm:px-6 py-2 text-sm sm:text-base rounded-full font-medium transition-all ${
          activeTab === 'Leave Requests' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        Leave Requests
      </button>
      <button
        onClick={() => {
          setCurrentView('change-password');
          setActiveTab('Change Password');
          setPasswordMessage('');
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        className={`px-4 sm:px-6 py-2 text-sm sm:text-base rounded-full font-medium transition-all ${
          activeTab === 'Change Password' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        Change Password
      </button>
    </div>
  );

  const OverviewView = () => (
    <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <MetricCard title="Pending Requests" value={pendingCount} icon={Clock} iconColor="text-yellow-600" bgColor="bg-yellow-50" />
        <MetricCard title="Approved Leave" value={approvedCount} icon={CheckCircle} iconColor="text-green-600" bgColor="bg-green-50" />
        <MetricCard title="Vacation Days Balance" value={'—'} icon={User} iconColor="text-blue-600" bgColor="bg-blue-50" />
        <MetricCard title="Rejected Leaves" value={rejectedCount} icon={XCircle} iconColor="text-red-600" bgColor="bg-red-50" />
      </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Quick Actions</h2>
        <p className="text-sm text-gray-600 mb-6">Common Tasks and Requests</p>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <QuickActionButton onClick={() => setCurrentView('paystubs')}>View Paystubs</QuickActionButton>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Latest Company Announcements</h2>
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
      {/* Mock */}
        <div>
          <AnnouncementItem
            text="Please review the updated holiday schedule for 2025. The office will be closed from December 24th to..."
            badge="General"
          />
          <AnnouncementItem
            text="The IT dept will be conducting a system upgrade on Saturday from 12:00 am to..."
            badge="Urgent"
          />
        </div>
      </div>
    </>
  );

  const RequestLeaveView = () => (
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Leave Requests</h2>
        <p className="text-gray-600">View and manage your time off requests</p>
      </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Leave Request</h3>
        <p className="text-sm text-gray-600 mb-6">Fill out the form to request time off</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select type</option>
              <option value="Vacation Leave">Vacation Leave</option>
              <option value="Sick Leave">Sick Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-2">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Please select a reason for your request</option>
            <option value="family-vacation">Family Vacation</option>
            <option value="medical">Medical Appointment</option>
            <option value="personal-matter">Personal Matter</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSubmitLeave}
            className="px-5 sm:px-6 py-3 text-sm sm:text-base rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#5F4B8B' }}
          >
            Submit Request
          </button>
          <button
            onClick={handleCancelLeave}
            className="px-5 sm:px-6 py-3 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {leaveRequests.map((request, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{request.type}</h3>
              <span
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                  request.status === 'Pending'
                    ? 'bg-yellow-500'
                    : request.status === 'Approved'
                    ? 'bg-green-600'
                    : 'bg-red-500'
                }`}
              >
                {request.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Start Date</p>
                <p className="text-sm text-gray-600">{request.startDate}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">End Date</p>
                <p className="text-sm text-gray-600">{request.endDate}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Reason</p>
              <p className="text-lg text-gray-900">{request.reason}</p>
            </div>
            <p className="text-sm text-gray-500">Submitted on {request.submittedOn}</p>
            {request.status !== 'Pending' && (
              <div className="mt-4">
                <button
                  onClick={() => handleDeleteLeave(request.id || request._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  const LeaveRequestsView = () => (
    <>
      <div className="flex flex-col gap-3 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Leave Requests</h2>
          <p className="text-gray-600">View and manage your time off requests</p>
        </div>
        <div className="flex flex-col items-start gap-2">
          <button
            onClick={() => setCurrentView('request-leave')}
            className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#5F4B8B' }}
          >
            <Calendar className="w-5 h-5" />
            New Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {leaveRequests.map((request, index) => (
          <div key={index} className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{request.type}</h3>
              <span
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                  request.status === 'Pending'
                    ? 'bg-yellow-500'
                    : request.status === 'Approved'
                    ? 'bg-green-600'
                    : 'bg-red-500'
                }`}
              >
                {request.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Start Date</p>
                <p className="text-sm text-gray-600">{request.startDate}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">End Date</p>
                <p className="text-sm text-gray-600">{request.endDate}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 mb-1">Reason</p>
              <p className="text-lg text-gray-900">{request.reason}</p>
            </div>
            <p className="text-sm text-gray-500">Submitted on {request.submittedOn}</p>
            {request.status !== 'Pending' && (
              <div className="mt-4">
                <button
                  onClick={() => handleDeleteLeave(request.id || request._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // Component to display employee paystubs in a formatted list
  const PaystubsView = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6" style={{ color: '#FFC72C' }} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paystubs</h2>
          <p className="text-sm text-gray-600">View your paystubs</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" style={{ color: '#FFC72C' }} />
          Paystub History
        </h3>
      </div>

      <div className="space-y-3">
        {paystubs.map((paystub, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div>
              <p className="font-medium text-gray-900">{paystub.date}</p>
              <p className="text-sm text-gray-600">${paystub.amount}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Component to handle password change functionality with form validation
  const ChangePasswordView = () => {
    const success = passwordMessage && passwordMessage.toLowerCase().includes('success');
    const alertColor = success ? 'text-green-600' : 'text-red-500';

    return (
      <div className="max-w-xl bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
        <p className="text-sm text-gray-600 mb-6">Verify your old password before setting a new one.</p>

        {passwordMessage && <div className={`mb-4 text-sm ${alertColor}`}>{passwordMessage}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Old Password</label>
            <input
              type="password"
              ref={oldPasswordRef}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your current password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">New Password</label>
            <input
              type="password"
              ref={newPasswordRef}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter a new password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm New Password</label>
            <input
              type="password"
              ref={confirmPasswordRef}
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Re-enter the new password"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleChangePassword}
            disabled={passwordSaving}
            className="px-5 sm:px-6 py-3 text-sm sm:text-base rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#5F4B8B' }}
          >
            {passwordSaving ? 'Updating...' : 'Update Password'}
          </button>
          <button
            onClick={() => {
              if (oldPasswordRef.current) oldPasswordRef.current.value = '';
              if (newPasswordRef.current) newPasswordRef.current.value = '';
              if (confirmPasswordRef.current) confirmPasswordRef.current.value = '';
              setPasswordMessage('');
            }}
            className="px-5 sm:px-6 py-3 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            Clear
          </button>
        </div>
      </div>
    );
  };

  const ProfileView = () => (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <button
          onClick={() => setCurrentView('overview')}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2 border-2 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all"
          style={{ borderColor: '#FFC72C' }}
        >
          <Home className="w-5 h-5" style={{ color: '#FFC72C' }} />
          Home Page
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex flex-col items-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3"
              style={{ backgroundColor: '#5F4B8B' }}
            >
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <p className="font-semibold text-gray-900">{currentUser.name}</p>
            <p className="text-sm text-gray-600">{currentUser.jobTitle || 'Employee'}</p>
            <p className="text-sm text-gray-600">{currentUser.department || ''}</p>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Email Address:</p>
              <p className="text-sm text-gray-900">{currentUser.email || 'N/A'}</p>
              <p className="text-sm text-gray-600">Phone:</p>
              <p className="text-sm text-gray-900">{formatPhone(employeeInfo?.phoneNumber) || 'N/A'}</p>
              <p className="text-sm text-gray-600">Home Address:</p>
              <p className="text-sm text-gray-900">{employeeInfo?.homeAddress || 'N/A'}</p>
              <p className="text-sm text-gray-600">Department:</p>
              <p className="text-sm text-gray-900">{employeeInfo?.department || currentUser.department || 'N/A'}</p>
              <p className="text-sm text-gray-600">Job Title:</p>
              <p className="text-sm text-gray-900">{employeeInfo?.jobTitle || currentUser.jobTitle || 'N/A'}</p>
              <p className="text-sm text-gray-600">Role:</p>
              <p className="text-sm text-gray-900">{currentUser.role || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Manager:</p>
              <p className="text-sm text-gray-900">{employeeInfo?.manager || 'N/A'}</p>
              <p className="text-sm text-gray-600">Hire Date:</p>
              <p className="text-sm text-gray-900">{formatDate(employeeInfo?.hireDate)}</p>
              <p className="text-sm text-gray-600">Employee ID:</p>
              <p className="text-sm text-gray-900">{employeeInfo?.employeeId || 'N/A'}</p>
              <p className="text-sm text-gray-600">Emergency Contact:</p>
              <p className="text-sm text-gray-900">{employeeInfo?.emergencyContact || 'N/A'}</p>
              <p className="text-sm text-gray-600">Emergency Phone:</p>
              <p className="text-sm text-gray-900">{formatPhone(employeeInfo?.emergencyContactPhone)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            If you would like to update your personal information, please reach out to your HR rep.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView !== 'profile' && <NavigationTabs />}

        {loading && <div className="text-center py-4">Loading...</div>}
        {error && <div className="text-center py-4 text-red-500">{error}</div>}

        {currentView === 'overview' && <OverviewView />}
        {currentView === 'request-leave' && <RequestLeaveView />}
        {currentView === 'leave-requests' && <LeaveRequestsView />}
        {currentView === 'paystubs' && <PaystubsView />}
        {currentView === 'change-password' && <ChangePasswordView />}
        {currentView === 'profile' && <ProfileView />}
      </div>
    </div>
  );
}
