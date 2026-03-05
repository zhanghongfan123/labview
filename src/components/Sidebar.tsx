import React from 'react';
import { Bot, FileText, CheckSquare, Layers, HelpCircle, X, Home } from 'lucide-react';
import { AGENTS, HOME_AGENT, type Agent } from '../types';

interface SidebarProps {
  currentAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
  isMobileOpen: boolean;
  isDesktopOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentAgent, onSelectAgent, isMobileOpen, isDesktopOpen, onMobileClose }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'home': return <Home className="w-5 h-5" />;
      case 'step1': return <FileText className="w-5 h-5" />;
      case 'step2': return <CheckSquare className="w-5 h-5" />;
      case 'step3': return <Layers className="w-5 h-5" />;
      case 'step4': return <Bot className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  const renderAgentButton = (agent: Agent) => (
    <button
      key={agent.id}
      onClick={() => {
        onSelectAgent(agent);
        onMobileClose();
      }}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors ${
        currentAgent.id === agent.id ? 'bg-gray-800 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
      }`}
      title={agent.name}
    >
      <div className={`${currentAgent.id === agent.id ? 'text-blue-400' : 'text-gray-400'}`}>
        {getIcon(agent.id)}
      </div>
      <div className={`${!isDesktopOpen && 'md:hidden'}`}>
        <div className="font-medium">{agent.name}</div>
        <div className="text-xs text-gray-500 truncate">{agent.description}</div>
      </div>
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[75%] max-w-[280px] md:w-64 bg-gray-900 text-white h-full flex flex-col border-r border-gray-800
        transform transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDesktopOpen ? 'md:translate-x-0 md:w-64' : 'md:hidden'}
      `}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center whitespace-nowrap">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" />
            <span className={`${!isDesktopOpen && 'md:hidden'}`}>LabVIEW</span>
          </h1>
          <button 
            onClick={onMobileClose}
            className="md:hidden p-1 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 whitespace-nowrap">
          {renderAgentButton(HOME_AGENT)}
          <div className="my-2 border-t border-gray-800 mx-4"></div>
          {AGENTS.map((agent) => renderAgentButton(agent))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
