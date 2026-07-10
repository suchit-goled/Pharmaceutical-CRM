import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-8">

      <div>

        <h2 className="text-2xl font-bold">
          Log Interaction
        </h2>

        <p className="text-sm text-slate-500">
          AI-powered Healthcare Professional CRM
        </p>

      </div>

      <div className="flex items-center gap-4">

        <div className="flex items-center gap-2 border rounded-xl px-4 py-2 bg-slate-50">

          <Search size={18} />

          <input
            placeholder="Search..."
            className="outline-none bg-transparent"
          />

        </div>

        <button className="relative">

          <Bell size={22} />

          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>

        </button>

        <img
          src="https://i.pravatar.cc/150?img=8"
          className="w-10 h-10 rounded-full"
          alt="User"
        />

      </div>

    </header>
  );
}