import { useState, useEffect } from "react";
import { Plus, Search, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  territory_id?: number | null;
  phone?: string | null;
  is_active: boolean;
  created_at?: string | null;
  last_login_at?: string | null;
}

export default function UserManagement() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "SALES_REP",
    phone: "",
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/users?page=1&page_size=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (roleFilter) url += `&role=${encodeURIComponent(roleFilter)}`;
      const res = await api.get(url);
      setUsers(res.data.items || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load user accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const toggleStatus = async (user: User) => {
    try {
      await api.patch(`/api/admin/users/${user.id}/status`);
      showToast(`Account status updated for ${user.email}`, "success");
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Status toggle failed", "error");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/users", formData);
      showToast(`User ${formData.email} registered successfully`, "success");
      setShowAddModal(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "SALES_REP",
        phone: "",
      });
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to create user", "error");
    }
  };

  return (
    <DashboardLayout
      title="User & Access Control (RBAC) Administration"
      subtitle="Manage field representatives, compliance officers, medical directors & granular privileges"
    >
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3.5 py-2 bg-slate-50 text-slate-600 flex-1 max-w-md">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by name, email..."
              className="outline-none bg-transparent text-sm w-full"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="SALES_REP">Sales Representative</option>
            <option value="MEDICAL_DIRECTOR">Medical Director</option>
            <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Create User Account
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Account Status</th>
              <th className="p-4">Last Login</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const roleColors: Record<string, string> = {
                ADMIN: "bg-purple-100 text-purple-800",
                SALES_REP: "bg-blue-100 text-blue-800",
                MEDICAL_DIRECTOR: "bg-amber-100 text-amber-800",
                COMPLIANCE_OFFICER: "bg-emerald-100 text-emerald-800",
              };

              return (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{u.full_name}</p>
                    <p className="text-slate-400">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${roleColors[u.role] || "bg-slate-100 text-slate-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{u.phone || "—"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${
                        u.is_active ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {u.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-[11px]">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => toggleStatus(u)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                        u.is_active
                          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Provision User Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="e.g. Helena Vance"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="user@medintelcrm.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="••••••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="SALES_REP">Sales Representative</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="MEDICAL_DIRECTOR">Medical Director</option>
                    <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs shadow transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
