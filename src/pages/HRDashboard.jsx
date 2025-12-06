import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import HREmployeesPage from "./HREmployeesPage";
import OnboardingPage from "./OnboardingPage";
import OffboardingPage from "./OffboardingPage";

/* ───────── helpers / small components ───────── */

const KPICard = ({ title, value }) => (
  <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 flex flex-col items-center justify-center text-center">
    <p className="text-sm text-slate-700">{title}</p>
    <p className="text-2xl font-semibold mt-2">{value}</p>
  </div>
);

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-0.5 text-[10px] font-medium text-slate-800">
    {children}
  </span>
);

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/MyHiveLogo.svg" alt="MyHive Logo" className="h-14 w-auto" />
      <span className="text-2xl font-semibold tracking-tight">
        Human Resources Dashboard
      </span>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <div className="flex flex-col gap-1">
      <span className="h-0.5 w-5 rounded-full bg-slate-900" />
      <span className="h-0.5 w-5 rounded-full bg-slate-900" />
      <span className="h-0.5 w-5 rounded-full bg-slate-900" />
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "employees", label: "Employees" },
  { id: "onboarding", label: "Onboarding" },
  { id: "offboarding", label: "Offboarding" },
];

const FALLBACK_USER = { name: "HR User", role: "HR", initials: "HR" };

/* reusable shell with user menu */
export function HRPageShell({ children, userInfo, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const display = userInfo || FALLBACK_USER;

  return (
    <div className="min-h-screen bg-[#F6F7FB]">
      <div className="relative mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-12 lg:py-6">
        <div className="flex items-center justify-between gap-3">
          <Logo />

          <div className="relative flex items-center gap-3 text-sm">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-slate-900 font-medium">{display.name}</p>
              <p className="text-xs text-slate-600">{display.role}</p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700"
              aria-label="Open user menu"
            >
              {display.initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden z-50">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout?.();
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 font-semibold"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 h-px bg-gray-200/80" />
        <div className="mt-8 lg:mt-6">{children}</div>
      </div>
    </div>
  );
}

/* ───────── main HRDashboard ───────── */
export default function HRDashboard() {
  const { user, logout } = useAuth();

  const [currentView, setCurrentView] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [kpis, setKpis] = useState([
    { title: "Total Employees", value: "..." },
    { title: "Active Employees", value: "..." },
    { title: "Pending Onboarding Tasks", value: "..." },
    { title: "Pending Offboarding Tasks", value: "..." },
  ]);
  const [activity, setActivity] = useState([{ tag: "Info", text: "Loading..." }]);
  const [dates, setDates] = useState([{ tag: "Info", text: "Loading..." }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userInfo = {
    name: user?.name || user?.email?.split("@")[0] || FALLBACK_USER.name,
    role: user?.role || FALLBACK_USER.role,
    initials: (user?.name || user?.email || FALLBACK_USER.initials).slice(0, 2).toUpperCase(),
  };

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError("");
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5233";
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/api/employee`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const emps = res.data?.employees || [];

        const total = emps.length;
        const active = emps.length;
        const onboarding = 0;
        const offboarding = 0;

        const recent = emps
          .filter((e) => e.hireDate)
          .sort((a, b) => new Date(b.hireDate) - new Date(a.hireDate))
          .slice(0, 3)
          .map((e) => ({
            tag: "New Hire",
            text: `${(e.firstName || "") + " " + (e.lastName || "")} joined as ${e.jobTitle || "Employee"}`.trim(),
          }));

        const today = new Date();
        const upcoming = [];
        emps.forEach((e) => {
          if (e.dob) {
            const dob = new Date(e.dob);
            const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            if (next < today) next.setFullYear(today.getFullYear() + 1);
            upcoming.push({
              date: next,
              tag: "Birthday",
              text: `${next.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${(e.firstName || "") + " " + (e.lastName || "")}`,
            });
          }
          if (e.hireDate) {
            const hd = new Date(e.hireDate);
            const next = new Date(today.getFullYear(), hd.getMonth(), hd.getDate());
            if (next < today) next.setFullYear(today.getFullYear() + 1);
            upcoming.push({
              date: next,
              tag: "Anniversary",
              text: `${next.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${(e.firstName || "") + " " + (e.lastName || "")}`,
            });
          }
        });
        upcoming.sort((a, b) => a.date - b.date);
        const topDates = upcoming.slice(0, 5).map(({ tag, text }) => ({ tag, text }));

        setKpis([
          { title: "Total Employees", value: total },
          { title: "Active Employees", value: active },
          { title: "Pending Onboarding Tasks", value: onboarding },
          { title: "Pending Offboarding Tasks", value: offboarding },
        ]);
        setActivity(recent.length ? recent : [{ tag: "Info", text: "No recent activity yet." }]);
        setDates(topDates.length ? topDates : [{ tag: "Info", text: "No upcoming dates yet." }]);
      } catch (err) {
        setError(err?.response?.data?.error || "Overview data cannot be obtained");
        setKpis([
          { title: "Total Employees", value: "—" },
          { title: "Active Employees", value: "—" },
          { title: "Pending Onboarding Tasks", value: "—" },
          { title: "Pending Offboarding Tasks", value: "—" },
        ]);
        setActivity([{ tag: "Info", text: "No recent activity yet." }]);
        setDates([{ tag: "Info", text: "No upcoming dates yet." }]);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const OverviewView = () => (
    <>
      <section className="mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-left">HR Dashboard</h1>
        <h2 className="mt-2 text-lg font-semibold text-left">Overview</h2>
      </section>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((k) => (
          <KPICard key={k.title} title={k.title} value={loading ? "..." : k.value} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[260px]">
          <h3 className="font-semibold text-sm mb-1">Recent Activity</h3>
          <p className="text-xs text-slate-600 mb-4">Here are the latest updates in your organization</p>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Pill>{item.tag}</Pill>
                  <p className="text-sm text-slate-800">{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[260px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Upcoming Important Dates</h3>
            <Bell className="w-4 h-4 text-slate-400" />
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <div className="space-y-3">
              {dates.map((d, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Pill>{d.tag}</Pill>
                  <p className="text-sm text-slate-800">{d.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );

  const EmployeesView = () => <HREmployeesPage />;
  const OnboardingView = () => <OnboardingPage />;
  const OffboardingView = () => <OffboardingPage />;

  return (
    <HRPageShell userInfo={userInfo} onLogout={logout}>
      <nav className="mt-6 hidden md:block">
        <div className="inline-flex h-[43px] items-center gap-2 rounded-[999px] bg-[#D9D9D9] px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentView(tab.id)}
              className={[
                "px-4 py-2 rounded-full text-sm transition-colors",
                currentView === tab.id ? "bg-[#E9E9E9] text-gray-900" : "text-gray-900 hover:bg-black/5",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-4 flex justify-end md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="border-0 bg-transparent p-0"
          aria-label="Toggle navigation"
        >
          <HamburgerIcon />
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute right-4 top-[135px] z-30 w-[78%] max-w-sm md:hidden">
          <div className="overflow-hidden rounded-[32px] bg-[#F2ECFF] shadow-2xl">
            {TABS.map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCurrentView(tab.id);
                  setMobileOpen(false);
                }}
                className={[
                  "block w-full text-left px-8 py-5 text-base",
                  idx > 0 ? "border-t border-white/60" : "",
                  currentView === tab.id
                    ? "font-semibold text-slate-900 bg-white/40"
                    : "font-medium text-slate-900 hover:bg-white/30",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        {currentView === "overview" && <OverviewView />}
        {currentView === "employees" && <EmployeesView />}
        {currentView === "onboarding" && <OnboardingView />}
        {currentView === "offboarding" && <OffboardingView />}
      </div>
    </HRPageShell>
  );
}
