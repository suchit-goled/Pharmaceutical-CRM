import { useState } from "react";
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
  MapPin,
  CalendarCheck,
  Calendar,
  PackageCheck,
  FileText,
  Boxes,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { user, logout, isAdmin, isDoctor, isPatient, isPharmacist } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Determine navigation items by role
  let navItems: { to: string; icon: any; label: string }[] = [];
  let navSectionTitle = "Healthcare & Pharma";

  if (isPatient) {
    navSectionTitle = "Patient Care Portal";
    navItems = [
      { to: "/dashboard", icon: LayoutDashboard, label: "My Health Dashboard" },
      { to: "/medications", icon: CalendarCheck, label: "My Medications" },
      { to: "/nearby-healthcare", icon: MapPin, label: "Nearby Healthcare Map" },
      { to: "/appointments", icon: Calendar, label: "Book Appointments" },
      { to: "/pharmacy-orders", icon: PackageCheck, label: "Pharmacy Orders" },
      { to: "/medical-reports", icon: FileText, label: "Medical Reports" },
    ];
  } else if (isDoctor) {
    navSectionTitle = "Doctor Clinical Portal";
    navItems = [
      { to: "/dashboard", icon: LayoutDashboard, label: "Clinical Dashboard" },
      { to: "/appointments", icon: Calendar, label: "Patient Appointments" },
      { to: "/medications", icon: CalendarCheck, label: "Prescriptions & Regimens" },
      { to: "/medical-reports", icon: FileText, label: "Patient Reports Review" },
      { to: "/nearby-healthcare", icon: MapPin, label: "Healthcare Facilities" },
      { to: "/hcps", icon: Users, label: "Peer HCP Directory" },
      { to: "/products", icon: Pill, label: "Drug Formulary" },
      { to: "/log-interaction", icon: ClipboardPlus, label: "Scientific Detailing (AI)" },
    ];
  } else if (isPharmacist) {
    navSectionTitle = "Pharmacy Dispensing Portal";
    navItems = [
      { to: "/dashboard", icon: LayoutDashboard, label: "Pharmacy Dashboard" },
      { to: "/pharmacy-orders", icon: PackageCheck, label: "Prescription Queue" },
      { to: "/pharmacy-inventory", icon: Boxes, label: "Medicine Stock" },
      { to: "/nearby-healthcare", icon: MapPin, label: "Healthcare Network" },
      { to: "/products", icon: Pill, label: "Products Catalogue" },
    ];
  } else if (isAdmin) {
    navSectionTitle = "Enterprise Administration";
    navItems = [
      { to: "/dashboard", icon: LayoutDashboard, label: "Executive Dashboard" },
      { to: "/nearby-healthcare", icon: MapPin, label: "Nearby Healthcare" },
      { to: "/medications", icon: CalendarCheck, label: "Medication Oversight" },
      { to: "/appointments", icon: Calendar, label: "All Appointments" },
      { to: "/pharmacy-orders", icon: PackageCheck, label: "All Pharmacy Orders" },
      { to: "/medical-reports", icon: FileText, label: "Medical Reports" },
      { to: "/pharmacy-inventory", icon: Boxes, label: "Pharmacy Inventory" },
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
  } else {
    // Commercial Sales Rep
    navSectionTitle = "Commercial Field CRM";
    navItems = [
      { to: "/dashboard", icon: LayoutDashboard, label: "Rep Dashboard" },
      { to: "/nearby-healthcare", icon: MapPin, label: "Nearby Healthcare" },
      { to: "/medications", icon: CalendarCheck, label: "My Medications" },
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
  }

  const adminNav = [
    { to: "/admin/users", icon: UserCheck, label: "User Management" },
    { to: "/admin/audit-logs", icon: ShieldAlert, label: "Security Audit" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200">
        <div className="flex items-center">
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
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-2 text-slate-400 hover:text-slate-700 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {navSectionTitle}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
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
                  onClick={() => setMobileOpen(false)}
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
              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-slate-200 text-slate-700 rounded uppercase">
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
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Floating Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-5 left-4 z-40 p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition"
        title="Open Navigation Menu"
      >
        <Menu size={20} />
      </button>

      {/* Desktop Static Sidebar */}
      <aside className="hidden md:flex w-72 border-r border-slate-200 flex-col h-screen shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer Body */}
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
