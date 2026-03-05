import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { AGENTS, type Agent } from './types';

function App() {
  const [currentAgent, setCurrentAgent] = useState<Agent>(AGENTS[0]);

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar 
        currentAgent={currentAgent} 
        onSelectAgent={setCurrentAgent} 
      />
      <main className="flex-1 h-full overflow-hidden">
        <ChatInterface agent={currentAgent} />
      </main>
    </div>
  );
}

export default App;
