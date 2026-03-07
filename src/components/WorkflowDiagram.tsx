import React from 'react';
import { ArrowRight, ArrowDown, FileText, CheckSquare, Layers, Bot, HelpCircle, Upload, Download, Share2, CornerDownRight } from 'lucide-react';
import { AGENTS, type Agent } from '../types';

interface WorkflowDiagramProps {
  onSelectAgent: (agent: Agent) => void;
}

const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ onSelectAgent }) => {
  const handleSelectAgent = (agentId: string) => {
    const targetAgent = AGENTS.find((agent) => agent.id === agentId);
    if (targetAgent) {
      onSelectAgent(targetAgent);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 rounded-3xl p-4 md:p-8 overflow-hidden">
      <div className="text-center mb-6 md:mb-8 flex-shrink-0">
        <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          智能体工作流程图
        </h2>
        <p className="text-sm md:text-base text-gray-600">从面板分析到测试生成的全流程开发助手</p>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden lg:block w-full h-full relative">
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" />
              </marker>
              <marker id="arrowhead-gray" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
              </marker>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.1"/>
              </filter>
            </defs>
            
            {/* Step1 to Step2 */}
            <path d="M 220 120 L 330 120" stroke="#6366F1" strokeWidth="3" markerEnd="url(#arrowhead)" />
            <rect x="255" y="100" width="40" height="20" rx="4" fill="#EEF2FF" />
            <text x="275" y="114" fontSize="10" fill="#6366F1" textAnchor="middle" fontWeight="600">截图</text>
            
            {/* Step2 to Step3 */}
            <path d="M 480 120 L 590 120" stroke="#6366F1" strokeWidth="3" markerEnd="url(#arrowhead)" />
            <rect x="515" y="100" width="40" height="20" rx="4" fill="#EEF2FF" />
            <text x="535" y="114" fontSize="10" fill="#6366F1" textAnchor="middle" fontWeight="600">JSON</text>
            
            {/* Step3 to Step4 */}
            <path d="M 740 120 L 790 120 L 790 220 L 740 220" stroke="#6366F1" strokeWidth="3" markerEnd="url(#arrowhead)" fill="none" />
            <rect x="795" y="160" width="50" height="20" rx="4" fill="#EEF2FF" />
            <text x="820" y="174" fontSize="10" fill="#6366F1" textAnchor="middle" fontWeight="600">搭建完成</text>
            
            {/* Step1 to Step4 (dashed) */}
            <path d="M 220 170 L 220 280 L 590 280" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="6,4" markerEnd="url(#arrowhead-gray)" fill="none" />
            <rect x="375" y="295" width="60" height="20" rx="4" fill="#F3F4F6" />
            <text x="405" y="309" fontSize="10" fill="#6B7280" textAnchor="middle" fontWeight="600">描述文字</text>
          </svg>
          
          {/* Agent Boxes Container */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Step1 */}
            <div className="absolute left-[5%] top-[20%] w-[17%] pointer-events-auto group">
              <div onClick={() => handleSelectAgent('step1')} className="relative bg-white border-2 border-blue-200 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-400 cursor-pointer">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">1</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-bold text-blue-800 text-base">Step 1</span>
                    <p className="text-xs text-blue-600 font-medium">面板读取</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">上传前后面板截图，生成文字描述</p>
              </div>
            </div>
            
            {/* Step2 */}
            <div className="absolute left-[32%] top-[20%] w-[17%] pointer-events-auto group">
              <div onClick={() => handleSelectAgent('step2')} className="relative bg-white border-2 border-green-200 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:shadow-green-100 transition-all duration-300 transform hover:-translate-y-1 hover:border-green-400 cursor-pointer">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">2</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                    <CheckSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <span className="font-bold text-green-800 text-base">Step 2</span>
                    <p className="text-xs text-green-600 font-medium">需求确认</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">填写需求表单，生成JSON需求文件</p>
              </div>
            </div>
            
            {/* Step3 */}
            <div className="absolute left-[59%] top-[20%] w-[17%] pointer-events-auto group">
              <div onClick={() => handleSelectAgent('step3')} className="relative bg-white border-2 border-purple-200 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:shadow-purple-100 transition-all duration-300 transform hover:-translate-y-1 hover:border-purple-400 cursor-pointer">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">3</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                    <Layers className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <span className="font-bold text-purple-800 text-base">Step 3</span>
                    <p className="text-xs text-purple-600 font-medium">面板搭建</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">根据JSON需求，指导搭建仿真</p>
              </div>
            </div>
            
            {/* Step4 */}
            <div className="absolute left-[59%] top-[55%] w-[17%] pointer-events-auto group">
              <div onClick={() => handleSelectAgent('step4')} className="relative bg-white border-2 border-orange-200 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:shadow-orange-100 transition-all duration-300 transform hover:-translate-y-1 hover:border-orange-400 cursor-pointer">
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">4</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <span className="font-bold text-orange-800 text-base">Step 4</span>
                    <p className="text-xs text-orange-600 font-medium">测试方案</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">上传搭建完成截图，生成测试方法</p>
              </div>
            </div>
            
            {/* Help */}
            <div className="absolute left-[38%] top-[82%] w-[24%] pointer-events-auto group">
              <div onClick={() => handleSelectAgent('help')} className="relative bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:border-gray-400 cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-base">辅助问答（Help）</span>
                    <p className="text-xs text-gray-600 font-medium">问答式用户使用手册</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">问答式用户使用手册</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile/Tablet Layout - Optimized */}
        <div className="lg:hidden w-full h-full overflow-y-auto pr-1 pb-4">
          <div className="flex flex-col gap-4">
            
            {/* Step 1 */}
            <div className="relative">
              <div onClick={() => handleSelectAgent('step1')} className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex gap-4 items-start relative z-10 cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800">Step 1 面板读取</h4>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">开始</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">上传前后面板截图，生成文字描述</p>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50/50 p-1.5 rounded-lg border border-blue-50 w-fit">
                    <Upload className="w-3 h-3" />
                    <span>输入: 截图</span>
                  </div>
                </div>
              </div>
              {/* Connector Line */}
              <div className="absolute left-6 top-full h-6 w-0.5 bg-gray-200 -ml-px z-0"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div onClick={() => handleSelectAgent('step2')} className="bg-white rounded-xl p-4 shadow-sm border border-green-100 flex gap-4 items-start relative z-10 cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800">Step 2 需求确认</h4>
                    <ArrowDown className="w-4 h-4 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">填写需求表单，生成JSON需求文件</p>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50/50 p-1.5 rounded-lg border border-green-50 w-fit">
                    <Download className="w-3 h-3" />
                    <span>输出: JSON需求</span>
                  </div>
                </div>
              </div>
              {/* Connector Line */}
              <div className="absolute left-6 top-full h-6 w-0.5 bg-gray-200 -ml-px z-0"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div onClick={() => handleSelectAgent('step3')} className="bg-white rounded-xl p-4 shadow-sm border border-purple-100 flex gap-4 items-start relative z-10 cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                  <Layers className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800">Step 3 面板搭建</h4>
                    <ArrowDown className="w-4 h-4 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-500 mb-2">根据JSON需求，指导搭建仿真</p>
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50/50 p-1.5 rounded-lg border border-purple-50 w-fit">
                    <CornerDownRight className="w-3 h-3" />
                    <span>输入: JSON需求</span>
                  </div>
                </div>
              </div>
              {/* Connector Line */}
              <div className="absolute left-6 top-full h-6 w-0.5 bg-gray-200 -ml-px z-0"></div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div onClick={() => handleSelectAgent('step4')} className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 flex gap-4 items-start relative z-10 cursor-pointer">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100">
                  <Bot className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800">Step 4 测试方案</h4>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">完成</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">上传搭建完成截图，生成测试方法</p>
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50/50 p-1.5 rounded-lg border border-orange-50 w-fit">
                    <Upload className="w-3 h-3" />
                    <span>输入: 完成截图</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cross Data Flow */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100/50 shadow-sm mt-2">
              <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-500" />
                数据流转说明
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs bg-white/60 p-2 rounded-lg border border-white/50">
                  <span className="text-gray-600">Step 1 描述</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="text-orange-600 font-medium">Step 4 复用</span>
                </div>
                <div className="flex items-center justify-between text-xs bg-white/60 p-2 rounded-lg border border-white/50">
                  <span className="text-gray-600">Step 2 JSON</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <span className="text-purple-600 font-medium">Step 3 输入</span>
                </div>
              </div>
            </div>

            {/* Help Agent */}
            <div onClick={() => handleSelectAgent('help')} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mt-2 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">辅助问答（Help）</h4>
                  <p className="text-xs text-gray-500">问答式用户使用手册</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDiagram;
