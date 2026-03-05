import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import Home from './components/Home';
import { AGENTS, HOME_AGENT, type Agent, type SharedData } from './types';

function App() {
  const [currentAgent, setCurrentAgent] = useState<Agent>(HOME_AGENT);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [sharedData, setSharedData] = useState<SharedData>(() => {
    try {
      const saved = localStorage.getItem('labview_shared_data');
      return saved ? JSON.parse(saved) : {
        step1Description: '',
        step2Json: ''
      };
    } catch (e) {
      console.error('Failed to load shared data:', e);
      return {
        step1Description: '',
        step2Json: ''
      };
    }
  });

  const updateSharedData = (key: keyof SharedData, value: string) => {
    setSharedData(prev => {
      const newData = { ...prev, [key]: value };
      try {
        localStorage.setItem('labview_shared_data', JSON.stringify(newData));
      } catch (e) {
        console.error('Failed to save shared data:', e);
      }
      return newData;
    });
  };

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
        {currentAgent.id === 'home' ? (
          <div className="h-full w-full overflow-y-auto">
            <Home 
              onSelectAgent={setCurrentAgent} 
              onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            />
          </div>
        ) : (
          <ChatInterface 
            key={currentAgent.id}
            agent={currentAgent} 
            onOpenSidebar={() => setIsMobileSidebarOpen(true)}
            isDesktopSidebarOpen={isDesktopSidebarOpen}
            onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
            sharedData={sharedData}
            updateSharedData={updateSharedData}
          />
        )}
      </main>
    </div>
  );
}

export default App;
