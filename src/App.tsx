import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { AGENTS, type Agent } from './types';

function App() {
  const [currentAgent, setCurrentAgent] = useState<Agent>(AGENTS[0]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar 
        currentAgent={currentAgent} 
        onSelectAgent={setCurrentAgent} 
        isMobileOpen={isMobileSidebarOpen}
        isDesktopOpen={isDesktopSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <main className="flex-1 h-full w-full relative">
        <ChatInterface 
          agent={currentAgent} 
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          isDesktopSidebarOpen={isDesktopSidebarOpen}
          onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
        />
      </main>
    </div>
  );
}

export default App;
