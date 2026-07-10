import {
  LayoutDashboard,
  Users,
  ClipboardPlus,
  History,
  BarChart3,
  Settings,
  BrainCircuit,
} from "lucide-react";

const menu = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    icon: ClipboardPlus,
    label: "Log Interaction",
    active: true,
  },
  {
    icon: Users,
    label: "HCP Directory",
  },
  {
    icon: History,
    label: "History",
  },
  {
    icon: BarChart3,
    label: "Analytics",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">

      <div className="h-20 flex items-center px-8 border-b">

        <BrainCircuit
          className="text-indigo-600"
          size={34}
        />

        <div className="ml-3">

          <h1 className="font-bold text-xl">
            MedIntel
          </h1>

          <p className="text-xs text-slate-500">
            AI CRM
          </p>

        </div>

      </div>

      <nav className="flex-1 p-4 space-y-2">

        {menu.map((item) => {

          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition

              ${
                item.active
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              <Icon size={18} />

              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t">

        <button className="flex items-center gap-3 text-slate-600 hover:text-black">

          <Settings size={18} />

          Settings

        </button>

      </div>

    </aside>
  );
}