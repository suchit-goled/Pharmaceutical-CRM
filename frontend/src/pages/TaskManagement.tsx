import { useState, useEffect } from "react";
import { Plus, Calendar, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

interface Task {
  id: number;
  title: string;
  description?: string | null;
  due_date: string;
  priority: string;
  status: string;
  assigned_to_id: number;
  hcp_id?: number | null;
  completed_at?: string | null;
}

export default function TaskManagement() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    priority: "Medium",
    status: "Pending",
    assigned_to_id: user?.id || 1,
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = `/api/tasks?page=1&page_size=50`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      const res = await api.get(url);
      setTasks(res.data.items || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load follow-up tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      await api.patch(`/api/tasks/${task.id}/status?status_val=${newStatus}`);
      showToast(`Task marked as ${newStatus}`, "success");
      fetchTasks();
    } catch (err) {
      showToast("Failed to update task status", "error");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/tasks", { ...formData, assigned_to_id: user?.id || 1 });
      showToast("Follow-up task created successfully", "success");
      setShowAddModal(false);
      setFormData({
        title: "",
        description: "",
        due_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        priority: "Medium",
        status: "Pending",
        assigned_to_id: user?.id || 1,
      });
      fetchTasks();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to create task", "error");
    }
  };

  return (
    <DashboardLayout
      title="Medical Detailing Tasks & Physician Follow-ups"
      subtitle="Scheduled sample checks, monograph deliveries, and clinical committee follow-ups"
    >
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 bg-slate-50 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none"
          >
            <option value="">All Tasks</option>
            <option value="Pending">Pending</option>
            <option value="In_Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <span className="text-xs text-slate-500">
            {tasks.filter((t) => t.status !== "Completed").length} open action items
          </span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> New Follow-up Task
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const isDone = task.status === "Completed";
          const priorityBadge: Record<string, string> = {
            High: "bg-rose-100 text-rose-800",
            Medium: "bg-amber-100 text-amber-800",
            Low: "bg-slate-100 text-slate-700",
          };

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition flex items-start gap-4 ${
                isDone
                  ? "bg-slate-50 border-slate-200 opacity-60"
                  : "bg-white border-slate-200 shadow-sm hover:border-indigo-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggleStatus(task)}
                className="mt-1 w-5 h-5 rounded text-indigo-600 cursor-pointer"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4
                    className={`font-bold text-sm text-slate-900 ${
                      isDone ? "line-through text-slate-400" : ""
                    }`}
                  >
                    {task.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      priorityBadge[task.priority] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {task.status}
                  </span>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                )}

                <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-indigo-600 font-medium">
                    <Calendar size={13} /> Due: {task.due_date}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Schedule Follow-up Action</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="e.g. Deliver Phase III Study to Dr. Hayes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Action Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
                  placeholder="Details regarding physician request or medical inquiry..."
                />
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
