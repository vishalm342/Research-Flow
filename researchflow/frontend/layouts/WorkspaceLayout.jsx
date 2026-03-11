import React from 'react';
import Sidebar from '../components/Sidebar';

const WorkspaceLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-workspace">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden bg-workspace">
        {children}
      </main>
    </div>
  );
};

export default WorkspaceLayout;