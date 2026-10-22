import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardPlus,
  History,
  Pill,
  Target,
  CheckSquare,
  Megaphone,
  FileSpreadsheet,
  ShieldAlert,
  UserCheck,
  BrainCircuit,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  const coreNav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/log-interaction", icon: ClipboardPlus, label: "Log Visit (AI)" },
    { to: "/interactions", icon: History, label: "Call History" },
    { to: "/hcps", icon: Users, label: "HCP Directory" },
    { to: "/hcos", icon: Building2, label: "Organizations" },
    { to: "/products", icon: Pill, label: "Products" },
    { to: "/leads", icon: Target, label: "Lead Pipeline" },
    { to: "/tasks", icon: CheckSquare, label: "Tasks & Alerts" },
    { to: "/campaigns", icon: Megaphone, label: "Campaigns" },
    { to: "/reports", icon: FileSpreadsheet, label: "Reports & Export" },
  ];

  const adminNav = [
    { to: "/admin/users", icon: UserCheck, label: "User Management" },
    { to: "/admin/audit-logs", icon: ShieldAlert, label: "Security Audit" },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-200">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <BrainCircuit size={24} />
        </div>
        <div className="ml-3">
          <h1 className="font-bold text-lg text-slate-900 tracking-tight">MedIntel CRM</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-xs text-slate-500 font-medium">Enterprise AI 2.0</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Pharma Workflows
        </div>
        {coreNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Administration
            </div>
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
              {user?.full_name ? user.full_name[0] : "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {user?.full_name || "Enterprise User"}
              </p>
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-slate-200 text-slate-700 rounded">
                {user?.role || "USER"}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
