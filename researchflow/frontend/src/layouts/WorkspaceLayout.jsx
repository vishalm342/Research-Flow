import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const WorkspaceLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-workspace">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <div
        className={`
          flex-shrink-0 h-full
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-0'}
          overflow-hidden
        `}
      >
        {/* Keep sidebar mounted so conversations don't re-fetch on every toggle */}
        <div className="w-64 h-full">
          <Sidebar />
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="relative flex-1 flex flex-col overflow-hidden bg-workspace min-w-0">
        {/* Floating toggle button */}
        <button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="
            absolute top-3 left-3 z-20
            w-8 h-8 flex items-center justify-center
            rounded-lg bg-slate-800/80 border border-slate-700/60
            text-slate-400 hover:text-white hover:bg-slate-700/80
            backdrop-blur-sm transition-all duration-150
            shadow-md
          "
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen
            ? <PanelLeftClose size={16} />
            : <PanelLeftOpen  size={16} />}
        </button>

        {/* Offset children so they don't sit under the toggle button */}
        <div className="flex-1 flex flex-col overflow-hidden pt-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default WorkspaceLayout;
