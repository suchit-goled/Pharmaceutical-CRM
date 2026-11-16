import { useState, type ReactNode } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import WhatsAppButton from "../components/common/WhatsAppButton";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden font-sans antialiased text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* Mobile-aware Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 overscroll-contain">
          {children}
        </main>

        {/* Global WhatsApp Quick Assistance Floating Widget */}
        <WhatsAppButton />
      </div>
    </div>
  );
}
