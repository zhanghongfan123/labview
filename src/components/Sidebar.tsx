import React from 'react';
import { Bot, FileText, CheckSquare, Layers, HelpCircle } from 'lucide-react';
import { AGENTS, type Agent } from '../types';

interface SidebarProps {
  currentAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentAgent, onSelectAgent }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'step1': return <FileText className="w-5 h-5" />;
      case 'step2': return <CheckSquare className="w-5 h-5" />;
      case 'step3': return <Layers className="w-5 h-5" />;
      case 'step4': return <Bot className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-400" />
          LabVIEW
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => onSelectAgent(agent)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors ${
              currentAgent.id === agent.id ? 'bg-gray-800 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
            }`}
          >
            <div className={`${currentAgent.id === agent.id ? 'text-blue-400' : 'text-gray-400'}`}>
              {getIcon(agent.id)}
            </div>
            <div>
              <div className="font-medium">{agent.name}</div>
              <div className="text-xs text-gray-500 truncate">{agent.description}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
        Powered by Gemini 3 Pro
      </div>
    </div>
  );
};

export default Sidebar;
