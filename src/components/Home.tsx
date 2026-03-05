import React from 'react';
import { Menu } from 'lucide-react';
import WorkflowDiagram from './WorkflowDiagram';

interface HomeProps {
  onSelectAgent: (agent: any) => void;
  onOpenSidebar: () => void;
}

const Home: React.FC<HomeProps> = ({ onSelectAgent, onOpenSidebar }) => {
  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      {/* Mobile Header with Menu Button */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-10 p-4 flex items-center">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-200 rounded-lg active:bg-gray-300 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-screen">
        <WorkflowDiagram />
      </div>
    </div>
  );
};

export default Home;
