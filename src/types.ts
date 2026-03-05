export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Array<{
    type: 'image' | 'file';
    url?: string;
    name?: string;
    upload_file_id?: string;
  }>;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon?: string;
  apiKey?: string;
}

export interface SharedData {
  step1Description: string;
  step2Json: string;
}

export type AgentId = 'home' | 'step1' | 'step2' | 'step3' | 'step4' | 'help';

export const HOME_AGENT: Agent = {
  id: 'home',
  name: '助手首页',
  description: '工作流程概览',
};

export const AGENTS: Agent[] = [
  {
    id: 'step1',
    name: '面板读取',
    description: '前后面板读取与描述',
    apiKey: import.meta.env.VITE_API_KEY_STEP1,
  },
  {
    id: 'step2',
    name: '需求确认',
    description: '需求分析与确认',
    apiKey: import.meta.env.VITE_API_KEY_STEP2,
  },
  {
    id: 'step3',
    name: '搭建指引',
    description: '面板搭建详细指引',
    apiKey: import.meta.env.VITE_API_KEY_STEP3,
  },
  {
    id: 'step4',
    name: '测试方案',
    description: '测试方案生成与迭代',
    apiKey: import.meta.env.VITE_API_KEY_STEP4,
  },
  {
    id: 'help',
    name: 'LabVIEW 助手',
    description: '通用 LabVIEW 问答助手',
    apiKey: import.meta.env.VITE_API_KEY_HELP,
  },
];
