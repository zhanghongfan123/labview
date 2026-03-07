import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import axios from 'axios';
import * as htmlToImage from 'html-to-image';
import { Send, Paperclip, Loader2, Image as ImageIcon, Trash2, Menu, ChevronDown, ChevronUp, Bot, FileText, CheckSquare, Layers, HelpCircle, Sparkles, Download, BookmarkPlus, Check, Upload, Pencil, X, LayoutGrid } from 'lucide-react';
import { type Message, type Agent, type SharedData, type SavedSchema, type SavedDiagram } from '../types';

interface ChatInterfaceProps {
  agent: Agent;
  onOpenSidebar: () => void;
  isDesktopSidebarOpen: boolean;
  onToggleDesktopSidebar: () => void;
  sharedData?: SharedData;
  updateSharedData?: (key: keyof SharedData, value: string) => void;
  saveSchema?: (schema: SavedSchema) => void;
  deleteSchema?: (schemaId: string) => void;
  renameSchema?: (schemaId: string, name: string) => void;
  diagramSlots?: (SavedDiagram | null)[];
  uploadDiagramToSlot?: (slotIdx: number, diagram: SavedDiagram) => void;
  renameDiagram?: (slotIdx: number, name: string) => void;
  deleteDiagram?: (slotIdx: number) => void;
}

interface MessageContentProps {
  content: string;
  onAction?: (text: string) => void;
}

const STEP2_REQUEST_TEMPLATE = `

表单补充：第 0 部分 - 大背景与基本功能
这部分不需要懂编程，只需要用大白话描述这个项目的背景。

1. 这个程序的文件名是什么？
（初学者填表提示：LabVIEW 的 VI 文件名通常直接暴露核心功能，比如 PID_Temp_Control.vi 或 Motor_Simulation.vi。）
2. 用一句话大白话描述：它是干什么用的？
（初学者填表提示：例如“交通灯倒计时模拟器”“读取温度传感器的程序”“生成正弦波并滤除噪声的仿真”。）
3. 它是纯软件仿真，还是连着真实硬件？
（初学者填表提示：是否连接 DAQ、串口线或测试设备；没有就是纯软件仿真。）
4. 这个程序是从哪来的？
（初学者填表提示：教材课后题、开源代码、或公司现有模板。）

第一部分：前面板（Front Panel）
输入区（你能改动的内容）：
- 有哪些按钮（开关、启动/停止）？
- 有哪些可输入数字的框或旋钮？
- 有下拉菜单吗？菜单里有哪些选项？

输出区（程序显示给你的内容）：
- 有没有波形图表（Graph/Chart）？有几根线？坐标轴代表什么？
- 有没有指示灯（亮/灭）？
- 有没有单独显示结果的数字框或字符串框？

第二部分：运行逻辑
点击左上角白色箭头运行后，程序表现是什么？
- 启动与停止：瞬间结束还是持续运行直到按停止？
- 因果关系：改动输入后，图表或数字发生了什么对应变化？
- 报错情况：运行中是否有弹窗报错？如有请附错误代码或截图描述。

第三部分：程序框图（Block Diagram）
- 整体框架：是否有包裹其他代码的大方框？描述边界颜色/形状。
- 关键颜色与线条：主要连线颜色是什么？是否有粗线（数组）？
- 子模块（SubVI）：有没有小正方形图标？图标上有哪些英文单词？

第四部分：你的新需求（你想改什么？）
- 想增加什么新功能？
- 想修改什么旧功能？`;

const STEP2_JSON_SCHEMA_TEMPLATE = `{
  "$id": "",
  "schemaVersion": "0.1.0",
  "tips": [
    "这是‘现有VI反向描述模板’，用于把一个VI完整映射成结构化信息。",
    "初学者可以只填 frontPanel + architecture + flowSummary；智能体也能开始工作。",
    "想做到单射：尽量补全 modules + resources + stateMachine + keyWires。"
  ],
  "meta": {
    "viName": "",
    "lvprojName": "",
    "labviewVersion": "",
    "target": "Windows",
    "dependencies": ["NI-VISA"],
    "oneLinePurpose": "",
    "authorOrOwner": "",
    "lastKnownWorking": true
  },
  "frontPanel": {
    "__comment": "把前面板当成‘接口层’：控件=输入，指示器=输出。每个元素都给唯一id，最好与终端名一致。",
    "controls": [
      {
        "id": "",
        "label": "",
        "kind": "NumericControl",
        "dataType": "DBL",
        "unit": "",
        "default": null,
        "range": { "min": null, "max": null },
        "isRequiredToRun": false,
        "triggersEvent": "None",
        "notes": ""
      }
    ],
    "indicators": [
      {
        "id": "",
        "label": "",
        "kind": "WaveformGraph",
        "dataType": "Waveform",
        "updateRateHzEstimate": null,
        "notes": ""
      }
    ],
    "uiRules": {
      "__comment": "把你观察到的禁用规则、可见性、属性节点写出来；不知道就留空。",
      "enableDisableRules": [
        { "elementId": "", "enabledWhen": "" }
      ],
      "elementsProgrammaticallyWritten": [
        { "elementId": "", "how": "PropertyNode|LocalVariable|Value(Signaling)", "notes": "" }
      ]
    }
  },
  "architecture": {
    "__comment": "宏观结构：你看到的 while/event/case/producer-consumer/state-machine 等。",
    "pattern": "EventDriven_StateMachine",
    "topLevelStructures": [
      { "id": "mainLoop", "type": "WhileLoop", "notes": "" },
      { "id": "event", "type": "EventStructure", "notes": "" },
      { "id": "case", "type": "CaseStructure", "notes": "" }
    ],
    "stopCondition": {
      "type": "StopButton|Error|Count|ExternalSignal|Other",
      "details": ""
    },
    "timing": {
      "loopWaitMsEstimate": null,
      "timedLoop": false,
      "notes": ""
    }
  },
  "stateMachine": {
    "__comment": "如果没有状态机，就填 enabled=false。若有：列出状态名、进入条件、退出条件。",
    "enabled": true,
    "stateType": "Enum|String|Integer|QMH_Message",
    "states": [
      {
        "name": "Idle",
        "runsWhere": "CaseStructure",
        "does": "更新UI/等待开始",
        "entryCondition": "",
        "exitCondition": ""
      }
    ],
    "eventsToStateTransitions": [
      {
        "uiEvent": "startBtn.ValueChange",
        "fromState": "Idle",
        "toState": "Run",
        "condition": "params valid"
      }
    ],
    "errorHandlingState": "Error",
    "shutdownState": "Shutdown"
  },
  "modules": {
    "__comment": "模块=可读的功能块。初学者只需要列关键模块：采集/配置/计算/显示/存盘/通信/安全停机。",
    "list": [
      {
        "id": "m1",
        "name": "",
        "type": "SubVI|DAQmx|VISA|FileIO|Math|UIUpdate|Custom",
        "responsibility": "",
        "runsIn": { "structureId": "case", "caseOrState": "Run|EVT_Start|Timeout" },
        "inputs": [
          { "name": "", "dataType": "", "source": "control|wire|constant|resource" }
        ],
        "outputs": [
          { "name": "", "dataType": "", "dest": "indicator|wire|resource" }
        ],
        "sideEffects": ["UI", "File", "DAQ", "Network", "Log"],
        "failureBehavior": "propagateError|retry|ignore|enterSafeState",
        "notes": ""
      }
    ]
  },
  "keyWires": {
    "__comment": "只写关键数据流，不用把所有线写出来。尤其要写 error wire 是否贯穿。",
    "errorWire": {
      "policy": "贯穿|部分贯穿|不使用",
      "centralHandlerModuleId": "",
      "notes": ""
    },
    "dataPaths": [
      {
        "name": "MainMeasurementPath",
        "from": ["control:vStart", "control:vStop"],
        "throughModules": ["m_validate", "m_sweep", "m_plot"],
        "to": ["indicator:ivGraph", "file:csv"]
      }
    ],
    "messagePassing": [
      {
        "kind": "Queue|Notifier|UserEvent|ChannelWire",
        "name": "",
        "producer": "",
        "consumer": "",
        "payloadType": "",
        "notes": ""
      }
    ]
  },
  "resources": {
    "__comment": "资源生命周期是VI稳定性的核心。尽量填：在哪开、在哪关、异常是否也会关。",
    "list": [
      {
        "id": "visa0",
        "type": "VISA|DAQTask|File|TCP|UDP|Camera|Other",
        "openWhere": "Connect|Init|OnDemand",
        "closeWhere": "Shutdown|Finally|OnDemand",
        "mustCloseOnError": true,
        "configNotes": ""
      }
    ]
  },
  "flowSummary": {
    "__comment": "把VI运行流程写成 6~12 步。越具体越好（尤其是触发点和安全态）。",
    "steps": [
      "启动VI，初始化UI为Idle。",
      "用户点击Connect，打开VISA会话并查询设备信息。",
      "用户设置扫描参数并点击Start，进入Run状态。",
      "Run状态循环执行：设置输出→等待稳定→测量→更新图→缓存数据。",
      "Stop或Error触发：进入安全态，输出置零/停止任务/关闭资源。",
      "保存数据文件并退出或回到Idle。"
    ]
  },
  "knownIssuesAndChangeRequests": {
    "__comment": "这部分直接喂给智能体做改造规划。",
    "knownIssues": ["运行时UI卡顿", "偶发设备断连后无法恢复"],
    "desiredChanges": ["增加过流保护", "增加自动保存参数快照", "重构为producer-consumer"]
  }
}`;

const MessageContent: React.FC<MessageContentProps> = React.memo(({ content, onAction }) => {
  const parts = [];
  let currentText = content;
  
  if (!content.includes('<think>')) {
    parts.push({ type: 'text', content: content });
  } else {
    while (currentText.length > 0) {
      const startIdx = currentText.indexOf('<think>');
      if (startIdx === -1) {
        parts.push({ type: 'text', content: currentText });
        break;
      }
      
      if (startIdx > 0) {
        parts.push({ type: 'text', content: currentText.slice(0, startIdx) });
      }
      
      const rest = currentText.slice(startIdx + 7);
      const endIdx = rest.indexOf('</think>');
      
      if (endIdx === -1) {
        parts.push({ type: 'think', content: rest });
        break;
      }
      
      parts.push({ type: 'think', content: rest.slice(0, endIdx) });
      currentText = rest.slice(endIdx + 8);
    }
  }

  return (
    <>
      {parts.map((part, index) => {
        // Use a unique key that combines index and content type to help React track elements
        const key = `part-${index}-${part.type}`;
        
        if (part.type === 'think') {
          return (
             <details key={key} className="mb-2 rounded-lg overflow-hidden border border-blue-100 bg-blue-50/50 group">
               <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-blue-600 select-none hover:bg-blue-100/50 transition-colors flex items-center gap-2 list-none">
                 <span className="opacity-70">💭 思考过程(点击展开)</span>
               </summary>
               <div className="p-2 md:p-3 text-gray-600 text-xs border-t border-blue-100/50 bg-white/50">
                 <div className="min-w-0" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                   <ReactMarkdown 
                     remarkPlugins={[remarkGfm]}
                     rehypePlugins={[rehypeRaw]}
                     components={{
                      pre: ({ ...props }) => (
                         <pre {...props} className="overflow-x-auto text-xs md:text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />
                       ),
                      code: ({ ...props }) => (
                         <code {...props} className="break-words" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }} />
                       ),
                      form: ({ ...props }) => (
                        <form {...props} onSubmit={(e) => { e.preventDefault(); }} />
                       ),
                      button: ({ ...props }) => (
                         <button {...props} type="button" onClick={(e) => {
                           e.preventDefault();
                          onAction?.(e.currentTarget.innerText);
                         }} />
                       ),
                     }}
                   >
                     {part.content}
                   </ReactMarkdown>
                 </div>
               </div>
             </details>
          );
        }
        return (
          <div key={key} className="break-words min-w-0" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                pre: ({ ...props }) => (
                  <pre {...props} className="overflow-x-auto text-xs md:text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />
                ),
                code: ({ ...props }) => (
                  <code {...props} className="break-words" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }} />
                ),
                form: ({ ...props }) => (
                  <form {...props} onSubmit={(e) => { e.preventDefault(); }} />
                ),
                button: ({ ...props }) => (
                  <button {...props} type="button" onClick={(e) => {
                    e.preventDefault();
                    onAction?.(e.currentTarget.innerText);
                  }} />
                ),
              }}
            >
              {part.content}
            </ReactMarkdown>
          </div>
        );
      })}
    </>
  );
});

const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent, onOpenSidebar, isDesktopSidebarOpen, onToggleDesktopSidebar, sharedData, updateSharedData, saveSchema, deleteSchema, renameSchema, diagramSlots = [null, null, null], uploadDiagramToSlot, renameDiagram, deleteDiagram }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(`chat_history_${agent.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(
    () => localStorage.getItem(`chat_conversation_id_${agent.id}`) || ''
  );
  
  // State for Step 2 inputs
  const [jsonSchema, setJsonSchema] = useState('');
  const [requestInput, setRequestInput] = useState(() => agent.id === 'step2' ? STEP2_REQUEST_TEMPLATE : '');
  const [isStep2PanelOpen, setIsStep2PanelOpen] = useState(true);
  const [autoUseStep1Description, setAutoUseStep1Description] = useState(true);

  // State for right panel (shared across all steps)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeSchemaId, setActiveSchemaId] = useState<string | null>(null);
  const [expandedSchemaId, setExpandedSchemaId] = useState<string | null>(null);
  const [editingSchemaId, setEditingSchemaId] = useState<string | null>(null);
  const [editingSchemaName, setEditingSchemaName] = useState('');
  const [inputBoxHeight, setInputBoxHeight] = useState(52);
  const [isInputResizing, setIsInputResizing] = useState(false);
  const [savedMsgIds, setSavedMsgIds] = useState<Set<string>>(new Set());

  // Diagram panel state
  const [editingDiagramSlot, setEditingDiagramSlot] = useState<number | null>(null);
  const [editingDiagramName, setEditingDiagramName] = useState('');
  const [uploadingSlotIdx, setUploadingSlotIdx] = useState<number | null>(null);
  const diagramInputRef = useRef<HTMLInputElement>(null);
  const [isMobileAssetPanelOpen, setIsMobileAssetPanelOpen] = useState(false);


  // Cache for image URLs from upload_file_id
  const [imageUrlCache, setImageUrlCache] = useState<Map<string, string>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const markdownActionTextRef = useRef<string | null>(null);
  const inputResizeStartYRef = useRef(0);
  const inputResizeStartHeightRef = useRef(52);

  const hasJsonContent = (content: string) => {
    if (!content) return false;
    const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    // Check for markdown code blocks or direct JSON object start
    return cleanContent.includes('```json') || cleanContent.startsWith('{');
  };

  const hasStep1Content = (content: string) => {
    if (!content) return false;
    const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    // Check for common Step 1 headers (flexible match)
    const headers = ['#', '##', '###', 'Panel', 'Analysis', 'Structure', '面板', '分析', '结构'];
    return headers.some(header => cleanContent.includes(header)) && cleanContent.length > 50;
  };


  const handleDiagramSlotUpload = (slotIdx: number) => {
    setUploadingSlotIdx(slotIdx);
    diagramInputRef.current?.click();
  };

  const handleDiagramFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingSlotIdx === null) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      uploadDiagramToSlot?.(uploadingSlotIdx, {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl,
        timestamp: Date.now(),
      });
    };
    reader.readAsDataURL(file);
    setUploadingSlotIdx(null);
    e.target.value = '';
  };

  const handleSaveSchema = (msgId: string, content: string) => {
    if (!saveSchema) return;
    const cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const jsonMatch = cleanContent.match(/```json\n([\s\S]*?)\n```/) || cleanContent.match(/```\n([\s\S]*?)\n```/);
    const schemaContent = jsonMatch ? jsonMatch[1].trim() : cleanContent;
    const schema: SavedSchema = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: `需求JSON ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`,
      content: schemaContent,
      timestamp: Date.now(),
    };
    saveSchema(schema);
    setSavedMsgIds(prev => new Set(prev).add(msgId));
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const getImageUrl = useCallback(async (uploadFileId: string): Promise<string | null> => {
    if (imageUrlCache.has(uploadFileId)) {
      return imageUrlCache.get(uploadFileId) || null;
    }
    
    try {
      const response = await axios.get(
        `/dify-api/files/${uploadFileId}`,
        {
          headers: {
            'Authorization': `Bearer ${agent.apiKey}`,
          },
        }
      );
      if (response.data && response.data.url) {
        setImageUrlCache(prev => new Map(prev).set(uploadFileId, response.data.url));
        return response.data.url;
      }
    } catch (error) {
      console.error('Failed to get image URL:', error);
    }
    return null;
  }, [agent.apiKey, imageUrlCache]);

  // Load image URLs when messages change
  useEffect(() => {
    const loadImageUrls = async () => {
      const newCache = new Map(imageUrlCache);
      let needsUpdate = false;
      
      for (const msg of messages) {
        if (msg.attachments) {
          for (const att of msg.attachments) {
            if (att.upload_file_id && !newCache.has(att.upload_file_id)) {
              const url = await getImageUrl(att.upload_file_id);
              if (url) {
                newCache.set(att.upload_file_id, url);
                needsUpdate = true;
              }
            }
          }
        }
      }
      
      if (needsUpdate) {
        setImageUrlCache(newCache);
      }
    };
    
    loadImageUrls();
  }, [messages, getImageUrl, imageUrlCache]);

  const getAgentConfig = (id: string) => {
    switch (id) {
      case 'step1':
        return {
          icon: <FileText className="w-12 h-12 text-blue-500" />,
          tips: ['上传前面板截图', '上传后面板截图', '分析 VI 结构'],
          color: 'bg-blue-50 text-blue-600'
        };
      case 'step2':
        return {
          icon: <CheckSquare className="w-12 h-12 text-green-500" />,
          tips: ['生成需求文档', '确认功能点', '优化参数配置'],
          color: 'bg-green-50 text-green-600'
        };
      case 'step3':
        return {
          icon: <Layers className="w-12 h-12 text-purple-500" />,
          tips: ['获取搭建步骤', '代码结构建议', '最佳实践指南'],
          color: 'bg-purple-50 text-purple-600'
        };
      case 'step4':
        return {
          icon: <Bot className="w-12 h-12 text-orange-500" />,
          tips: ['生成测试用例', '覆盖率分析', '边界条件检查'],
          color: 'bg-orange-50 text-orange-600'
        };
      default:
        return {
          icon: <HelpCircle className="w-12 h-12 text-gray-500" />,
          tips: ['LabVIEW 基础知识', '常见错误排查', '性能优化建议'],
          color: 'bg-gray-50 text-gray-600'
        };
    }
  };

  const handleQuickAction = (text: string) => {
    setInput(text);
  };

  const handleMarkdownAction = (text: string) => {
    const actionText = text.trim();
    if (!actionText) return;
    if (isLoading) return;
    markdownActionTextRef.current = actionText;
    setInput(actionText);
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  };

  const handleInputResizeStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    inputResizeStartYRef.current = e.clientY;
    inputResizeStartHeightRef.current = inputBoxHeight;
    setIsInputResizing(true);
  };

  useEffect(() => {
    if (!isInputResizing) return;
    const handleMove = (e: PointerEvent) => {
      const maxAvailableHeight = Math.max(160, Math.floor(window.innerHeight * 0.7));
      const nextHeight = Math.max(44, Math.min(maxAvailableHeight, inputResizeStartHeightRef.current - (e.clientY - inputResizeStartYRef.current)));
      setInputBoxHeight(nextHeight);
    };
    const handleUp = () => setIsInputResizing(false);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isInputResizing]);

  const persistHistory = useCallback(async (history: Message[]) => {
    if (history.length === 0) return;
    localStorage.setItem(`chat_history_${agent.id}`, JSON.stringify(history));
    try {
      await axios.post(`/api/history/${agent.id}`, history);
    } catch (error) {
      console.error('Failed to save history to server:', error);
    }
  }, [agent.id]);

  const getHistoryTimestamp = (history: Message[]) => {
    if (history.length === 0) return 0;
    return history[history.length - 1]?.timestamp || 0;
  };

  // Sync from server in background (localStorage already pre-loaded above)
  useEffect(() => {
    const syncFromServer = async () => {
      try {
        const localRaw = localStorage.getItem(`chat_history_${agent.id}`);
        const localHistory: Message[] = localRaw ? JSON.parse(localRaw) : [];
        const response = await axios.get(`/api/history/${agent.id}`);
        if (response.data && Array.isArray(response.data)) {
          const serverHistory = response.data as Message[];
          const serverTs = getHistoryTimestamp(serverHistory);
          const localTs = getHistoryTimestamp(localHistory);
          const preferredHistory = localTs > serverTs ? localHistory : serverHistory;

          if (preferredHistory.length > 0) {
            setMessages(preferredHistory);
          }
          if (localTs > serverTs) {
            await persistHistory(localHistory);
          }
        }
      } catch {
        // localStorage fallback already shown, no action needed
      }
    };

    syncFromServer();

    setSelectedFile(null);
    setPreviewUrl(null);
    setInput('');
    setJsonSchema('');
    setRequestInput(agent.id === 'step2' ? STEP2_REQUEST_TEMPLATE : '');
  }, [agent, persistHistory]);

  // Save messages to local server and localStorage
  useEffect(() => {
    const saveHistory = async () => {
      await persistHistory(messages);
    };

    // Debounce saving to avoid too many requests during streaming
    const timeoutId = setTimeout(saveHistory, 300);
    return () => clearTimeout(timeoutId);
  }, [messages, persistHistory]);

  useEffect(() => {
    const flushHistoryOnUnload = () => {
      if (messages.length === 0) return;
      const payload = JSON.stringify(messages);
      localStorage.setItem(`chat_history_${agent.id}`, payload);
      navigator.sendBeacon(
        `/api/history/${agent.id}`,
        new Blob([payload], { type: 'application/json' })
      );
    };
    window.addEventListener('beforeunload', flushHistoryOnUnload);
    return () => {
      window.removeEventListener('beforeunload', flushHistoryOnUnload);
    };
  }, [messages, agent.id]);

  // Save conversationId to localStorage
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(`chat_conversation_id_${agent.id}`, conversationId);
    } else {
      localStorage.removeItem(`chat_conversation_id_${agent.id}`);
    }
  }, [conversationId, agent.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Auto-save image to diagram library (max 3, replace oldest when full)
        if (uploadDiagramToSlot) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            const emptyIdx = diagramSlots.findIndex(s => s === null);
            const targetSlot = emptyIdx !== -1
              ? emptyIdx
              : diagramSlots.reduce((oldestIdx, slot, idx) =>
                  slot && diagramSlots[oldestIdx] && slot.timestamp < diagramSlots[oldestIdx]!.timestamp
                    ? idx : oldestIdx, 0);
            uploadDiagramToSlot(targetSlot, {
              id: Date.now().toString(36) + Math.random().toString(36).substr(2),
              name: file.name.replace(/\.[^/.]+$/, ''),
              dataUrl,
              timestamp: Date.now(),
            });
          };
          reader.readAsDataURL(file);
        }
      } else {
        setPreviewUrl(null);
      }
      
      e.target.value = '';
    }
  };

  const handleUseLibraryImage = (dataUrl: string, name: string) => {
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${name}.png`, { type: blob.type || 'image/png' });
        setSelectedFile(file);
        setPreviewUrl(dataUrl);
        setIsMobileAssetPanelOpen(false);
      })
      .catch(() => {
        setSelectedFile(null);
        setPreviewUrl(dataUrl);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const forcedActionText = markdownActionTextRef.current?.trim() || '';
    if ((!input.trim() && !selectedFile && !forcedActionText) || isLoading) return;

    let userContent = forcedActionText || input;
    if (!userContent.trim() && selectedFile) {
      userContent = selectedFile.name;
    }
    markdownActionTextRef.current = null;

    let uploadFileId: string | undefined = undefined;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
      attachments: selectedFile ? [{
        type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
        url: previewUrl || undefined,
        name: selectedFile.name,
        upload_file_id: uploadFileId
      }] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    let assistantMessageContent = '';

    try {
      if (!agent.apiKey) {
        throw new Error('API key not configured for this agent');
      }

      // Prepare payload for Dify API
      const payload: {
        inputs: Record<string, unknown>;
        query: string;
        response_mode: 'streaming';
        user: string;
        files: Array<{
          type: 'image' | 'file';
          transfer_method: 'local_file' | 'remote_url';
          upload_file_id?: string;
          url?: string;
        }>;
        conversation_id?: string;
      } = {
        inputs: {},
        query: userContent,
        response_mode: "streaming",
        user: "user-123", // Replace with actual user ID management
        files: []
      };

      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('user', 'user-123'); // Adjust as needed

        try {
          const uploadResponse = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/files/upload`,
            formData,
            {
              headers: {
                'Authorization': `Bearer ${agent.apiKey}`,
                'Content-Type': 'multipart/form-data',
              },
            }
          );

          if (uploadResponse.data && uploadResponse.data.id) {
            uploadFileId = uploadResponse.data.id;
            payload.files = [
              {
                type: 'image',
                transfer_method: 'local_file',
                upload_file_id: uploadResponse.data.id,
              },
            ];
            
            // Update the user message with the upload_file_id
            setMessages((prev) => prev.map(msg => 
              msg.id === userMessage.id 
                ? {
                    ...msg,
                    attachments: msg.attachments?.map(att => 
                      att.name === selectedFile.name 
                        ? { ...att, upload_file_id: uploadFileId }
                        : att
                    )
                  }
                : msg
            ));
          }
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `文件上传失败: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }
      }

      // ---------------------------------------------------------
      // Specific Agent Input Mapping based on Requirements
      // ---------------------------------------------------------

      // Helper to check if file is uploaded
      const hasFile = payload.files && payload.files.length > 0;
      const fileId = hasFile ? payload.files[0].upload_file_id : null;

      if (agent.id === 'step1') {
        // Step 1: inputs: { pic: file }
        // Validation: Must have file on first turn
        if (!conversationId && !hasFile) {
           const errorMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `请上传面板截图以便我进行分析。`,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setIsLoading(false);
            return;
        }
        if (hasFile) {
           payload.inputs['pic'] = {
               type: 'image',
               transfer_method: 'local_file',
               upload_file_id: fileId
           };
        }
      } 
      else if (agent.id === 'step2') {
         // Step 2: inputs: { json_schema: string, request: string, pic: file }
         payload.inputs['json_schema'] = jsonSchema || "{}"; 
         payload.inputs['request'] = requestInput || userContent; 
         
         if (hasFile) {
            payload.inputs['pic'] = {
                type: 'image',
                transfer_method: 'local_file',
                upload_file_id: fileId
            };
            // Clear files array as requested by user for Step 2
            payload.files = [];
         }
       }
      else if (agent.id === 'step3') {
        // Step 3: inputs: {} (Empty)
        // No automatic JSON injection - user must manually select from saved schemas if needed
      }
      else if (agent.id === 'step4') {
        // Step 4: inputs: { sd: file }
        if (hasFile) {
           payload.inputs['sd'] = [{
               type: 'image',
               transfer_method: 'local_file',
               upload_file_id: fileId
           }];
        }
        
        // Include Step1 description if available
        if (autoUseStep1Description && sharedData?.step1Description) {
          payload.query = `${userContent}\n\n以下是 Step1 生成的面板描述：\n${sharedData.step1Description}`;
        }
      }
      else if (agent.id === 'help') {
        // Help: inputs: {} (Empty)
      }

      // Streaming request using fetch instead of axios for better stream handling
      let response;
      let retryCount = 0;
      const maxRetries = 1;

      while (retryCount <= maxRetries) {
        response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${agent.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.status === 404) {
          // Check if it's "Conversation Not Exists"
          const clonedRes = response.clone();
          try {
            const errorData = await clonedRes.json();
            if (errorData.code === 'not_found' || (errorData.message && errorData.message.includes('Conversation'))) {
              if (retryCount < maxRetries) {
                console.log('Conversation expired, retrying with new session...');
                setConversationId('');
                localStorage.removeItem(`chat_conversation_id_${agent.id}`);
                payload.conversation_id = '';
                retryCount++;
                continue;
              }
            }
          } catch {
            // Ignore json parse error
          }
        }
        break;
      }

      if (!response || !response.ok) {
        let errorMsg = response ? `API Error: ${response.status} ${response.statusText}` : 'API Error: No response';
        if (response) {
          try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
              errorMsg += ` - ${errorData.message}`;
            }
            if (errorData && errorData.code) {
               errorMsg += ` (Code: ${errorData.code})`;
            }
          } catch {
            // Ignore json parse error
          }
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Create a placeholder message for the assistant
      const assistantMessageId = generateUniqueId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '', // Start empty
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const data = JSON.parse(dataStr);
              
              if (data.event === 'message' || data.event === 'agent_message') {
                assistantMessageContent += data.answer;
                
                // Update the message in state
                setMessages((prev) => 
                  prev.map((msg) => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantMessageContent }
                      : msg
                  )
                );
                
                // Update conversation ID if provided
                if (data.conversation_id && !conversationId) {
                  setConversationId(data.conversation_id);
                }
              } else if (data.event === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error calling API:', error);
      let errorContent = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;

      // Auto-recovery for invalid conversation ID
      if (errorContent.includes('Conversation Not Exists') || errorContent.includes('404 NOT FOUND')) {
        setConversationId('');
        localStorage.removeItem(`chat_conversation_id_${agent.id}`);
        errorContent += '\n\n**检测到会话已失效，已自动重置会话ID。请重新发送您的请求。**';
      }

      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Save Step1 description to shared data
      if (agent.id === 'step1' && assistantMessageContent && updateSharedData) {
        updateSharedData('step1Description', assistantMessageContent);
      }
      
      // Save Step2 JSON to shared data
      if (agent.id === 'step2' && assistantMessageContent && updateSharedData) {
        updateSharedData('step2Json', assistantMessageContent);
      }
    }
  };

  const handleClearHistory = async () => {
    if (confirm('确定要清除当前对话历史吗？')) {
      localStorage.removeItem(`chat_history_${agent.id}`);
      localStorage.removeItem(`chat_conversation_id_${agent.id}`);
      
      // Clear from server
      try {
        await axios.post(`/api/history/${agent.id}`, []);
      } catch (error) {
        console.error('Failed to clear history on server:', error);
      }

      setConversationId('');
      setMessages([
        {
          id: `welcome-${agent.id}`,
          role: 'assistant',
          content: `你好！我是 **${agent.name}** 助手，${agent.description}。请问有什么可以帮您？`,
          timestamp: Date.now(),
        },
      ]);
    }
  };


  const handleDownloadMessageContent = async (messageId: string, timestamp: number) => {
    const element = document.getElementById(`message-content-${messageId}`);
    if (!element) return;

    try {
      const dataUrl = await htmlToImage.toPng(element, {
        backgroundColor: '#ffffff',
        style: {
          padding: '20px',
          borderRadius: '8px'
        }
      });
      
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `step1_panel_description_${new Date(timestamp).toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('生成图片失败，请重试');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-gray-50 overflow-hidden">
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative z-0 ${agent.id === 'step2' && !isStep2PanelOpen ? 'w-full' : 'w-full'}`}>
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 shadow-sm flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={onOpenSidebar}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors"
              title="打开菜单"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Desktop Sidebar Toggle */}
            <button
              onClick={onToggleDesktopSidebar}
              className="hidden md:block p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors mr-2"
              title={isDesktopSidebarOpen ? "收起侧边栏" : "展开侧边栏"}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">{agent.name}</h2>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5 line-clamp-1">{agent.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mobile asset panel toggle */}
            {['step1','step2','step3','step4'].includes(agent.id) && (
              <button
                onClick={() => setIsMobileAssetPanelOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-100"
                title="素材库"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleClearHistory}
              className="p-2 md:p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
              title="清除历史记录"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {agent.id === 'step2' && (
          <div className="border-b border-gray-200 bg-white flex-shrink-0">
            <button
              type="button"
              className="w-full px-4 md:px-6 py-2 md:py-3 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setIsStep2PanelOpen(!isStep2PanelOpen)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <h3 className="font-bold text-gray-800 text-sm md:text-base">需求配置</h3>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  建议填写 <span className="font-semibold text-gray-700">JSON Schema</span> 和 <span className="font-semibold text-gray-700">Request</span>，生成效果更好。
                </p>
              </div>
              <span className="mt-0.5 text-gray-500 flex-shrink-0">
                {isStep2PanelOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </span>
            </button>

            {isStep2PanelOpen && (
              <div className="px-4 pb-3 md:px-6 md:pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-7 flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-700">JSON Schema</label>
                    <button
                      type="button"
                      onClick={() => setJsonSchema(STEP2_JSON_SCHEMA_TEMPLATE)}
                      className="text-[11px] leading-none px-2 py-1 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0"
                    >
                      一键填充模板
                    </button>
                  </div>
                  <textarea
                    value={jsonSchema}
                    onChange={(e) => setJsonSchema(e.target.value)}
                    placeholder='{ "type": "object", ... }'
                    className="w-full h-56 md:h-64 p-2 border border-gray-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-7 flex items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-gray-700">Request</label>
                    <span className="text-[11px] leading-none text-amber-600 whitespace-nowrap shrink-0">备注：请用户根据模板改写。</span>
                  </div>
                  <textarea
                    value={requestInput}
                    onChange={(e) => setRequestInput(e.target.value)}
                    className="w-full h-56 md:h-64 p-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-white whitespace-pre-wrap"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-8 animate-fade-in">
              <div className={`p-4 md:p-6 rounded-3xl mb-4 md:mb-6 ${getAgentConfig(agent.id).color} bg-opacity-50`}>
                {getAgentConfig(agent.id).icon}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">{agent.name}</h3>
              <p className="text-gray-500 max-w-md mb-6 md:mb-8 leading-relaxed px-4">{agent.description}</p>
              
              {/* Show shared data indicator */}
              {agent.id === 'step4' && (
                <div className="mb-6 px-4">
                  <label className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 text-sm text-blue-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoUseStep1Description}
                      onChange={(e) => setAutoUseStep1Description(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span>是否自动获取 Step1 面板描述</span>
                  </label>
                </div>
              )}
              
              {agent.id === 'step3' && (
                <div className="mb-6 px-4">
                  <div className="text-xs text-gray-500">请从右侧素材库选择需求 JSON 或直接输入</div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg px-4">
                {getAgentConfig(agent.id).tips.map((tip, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(tip)}
                    className="flex items-center gap-3 p-3 md:p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-500 group-hover:bg-blue-100 transition-colors flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-gray-600 font-medium group-hover:text-blue-700 transition-colors line-clamp-2">{tip}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}
                >
                  <div className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                        : 'bg-white border border-gray-100'
                    }`}>
                      {msg.role === 'user' ? (
                        <span className="text-[10px] md:text-xs font-bold">ME</span>
                      ) : (
                        <Bot className={`w-4 h-4 md:w-6 md:h-6 ${
                          agent.id === 'step1' ? 'text-blue-500' :
                          agent.id === 'step2' ? 'text-green-500' :
                          agent.id === 'step3' ? 'text-purple-500' :
                          agent.id === 'step4' ? 'text-orange-500' : 'text-gray-500'
                        }`} />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-3 py-2 md:px-6 md:py-4 shadow-sm max-w-[85%] md:max-w-[75%] lg:max-w-[65%] ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <div id={`message-content-${msg.id}`} className={`prose ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'} max-w-none text-sm leading-relaxed break-words notranslate`} translate="no">
                        <MessageContent content={msg.content} onAction={handleMarkdownAction} />
                      </div>
                      {agent.id === 'step1' && msg.role === 'assistant' && msg.content && hasStep1Content(msg.content) && (
                        <div className="mt-2 flex justify-end">
                           <button
                             onClick={() => handleDownloadMessageContent(msg.id, msg.timestamp)}
                             className="flex items-center gap-1.5 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-100"
                             title="下载此回答为图片"
                           >
                             <Download className="w-3 h-3" />
                             <span>下载图片</span>
                           </button>
                        </div>
                      )}
                      {agent.id === 'step2' && msg.role === 'assistant' && msg.content && hasJsonContent(msg.content) && (
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            onClick={() => handleSaveSchema(msg.id, msg.content)}
                            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors border ${
                              savedMsgIds.has(msg.id)
                                ? 'text-purple-400 border-purple-100 bg-purple-50 cursor-default'
                                : 'text-purple-600 hover:bg-purple-50 border-purple-100'
                            }`}
                            title="保存到 Step3 方案槽位"
                            disabled={savedMsgIds.has(msg.id)}
                          >
                            {savedMsgIds.has(msg.id) ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                            <span>{savedMsgIds.has(msg.id) ? '已保存' : '保存 Schema'}</span>
                          </button>
                        </div>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 max-w-full">
                          {msg.attachments.map((attachment, idx) => {
                            // Prefer persistent URL from upload_file_id, fallback to direct URL
                            const imageUrl = attachment.upload_file_id 
                              ? imageUrlCache.get(attachment.upload_file_id) || attachment.url
                              : attachment.url;
                            
                            // Skip if no valid URL
                            if (!imageUrl) {
                              return null;
                            }
                            
                            // Skip blob URLs as they become invalid after page refresh
                            if (imageUrl.startsWith('blob:')) {
                              return null;
                            }
                            
                            return attachment.type === 'image' ? (
                              <div key={`${msg.id}-img-${idx}`} className="relative group w-full">
                                <img 
                                  src={imageUrl} 
                                  alt={attachment.name || 'Uploaded image'}
                                  className="w-full h-auto rounded-lg border border-blue-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                  style={{ maxWidth: '100%', objectFit: 'contain' }}
                                  onClick={() => {
                                    const newWindow = window.open();
                                    if (newWindow) {
                                      newWindow.document.write(`<img src="${imageUrl}" style="max-width:100%;height:auto;" />`);
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div key={`${msg.id}-file-${idx}`} className="flex items-center gap-2 bg-blue-50/50 px-3 py-2 rounded-lg text-xs text-blue-700 border border-blue-100 max-w-full">
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{attachment.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="flex gap-2 md:gap-3">
                    <div className="flex-shrink-0 w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm bg-white border border-gray-100">
                      <Bot className={`w-4 h-4 md:w-6 md:h-6 ${
                        agent.id === 'step1' ? 'text-blue-500' :
                        agent.id === 'step2' ? 'text-green-500' :
                        agent.id === 'step3' ? 'text-purple-500' :
                        agent.id === 'step4' ? 'text-orange-500' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 md:px-6 md:py-4 shadow-sm flex items-center gap-2 md:gap-3 text-gray-500 max-w-[85%] md:max-w-[75%]">
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-blue-500" />
                      <span className="text-xs md:text-sm font-medium">正在思考中...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="bg-white border-t border-gray-200 p-2 md:p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10 pb-safe">
          {selectedFile && (
            <div className="mb-2 md:mb-3 flex flex-col gap-2 animate-slide-up">
              {previewUrl && (
                <div className="relative inline-block max-w-[200px] md:max-w-[250px] rounded-lg overflow-hidden border border-blue-200 shadow-sm">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-w-full h-auto max-h-[200px] object-contain bg-gray-50"
                  />
                  <button 
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                    title="移除图片"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              {!previewUrl && (
                <div className="flex items-center gap-2 bg-blue-50 p-2 md:p-2.5 rounded-lg text-xs md:text-sm text-blue-700 max-w-[calc(100%-1rem)] md:max-w-max border border-blue-100">
                  <FileText className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[calc(100%-60px)] md:max-w-[200px]">{selectedFile.name}</span>
                  <button 
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="ml-auto md:ml-2 text-blue-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 flex-shrink-0"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          )}
          <form ref={formRef} onSubmit={handleSubmit} className="flex gap-1 md:gap-3 items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.json,.txt,.md"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 md:p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-100 flex-shrink-0"
              title="上传文件"
            >
              <Paperclip className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="flex-1 relative min-w-0">
              <div className="mb-1 flex justify-center">
                <button
                  type="button"
                  onPointerDown={handleInputResizeStart}
                  className="h-1.5 w-12 rounded-full bg-gray-300 hover:bg-gray-400 active:bg-gray-500 cursor-ns-resize"
                  aria-label="调整输入框高度"
                />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={`发送给 ${agent.name}...`}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 md:px-4 md:py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm overflow-hidden text-sm md:text-base"
                rows={1}
                style={{ height: `${inputBoxHeight}px`, minHeight: '44px', resize: 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className="bg-blue-600 text-white p-2 md:p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md shadow-blue-200 flex-shrink-0"
            >
              <Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </form>
        </div>
      </div>

      {/* Right panel: shared across all steps */}
      {['step1','step2','step3','step4'].includes(agent.id) && (
        <>
          {/* Hidden diagram file input (shared between desktop & mobile) */}
          <input
            type="file"
            ref={diagramInputRef}
            onChange={handleDiagramFileSelect}
            accept="image/*"
            className="hidden"
          />

          {/* ── Desktop sidebar ── */}
          <div className={`hidden lg:flex ${isRightPanelOpen ? 'w-72' : 'w-10'} border-l border-gray-200 bg-white flex-col overflow-hidden transition-all duration-300 flex-shrink-0`}>
            <div
              className="px-3 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors flex-shrink-0"
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            >
              {isRightPanelOpen && (
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">素材库</span>
              )}
              <button className="text-gray-400 hover:text-gray-600 transition-colors ml-auto">
                {isRightPanelOpen ? <ChevronDown className="w-4 h-4 -rotate-90" /> : <ChevronUp className="w-4 h-4 -rotate-90" />}
              </button>
            </div>
            {isRightPanelOpen && (
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                <AssetPanelContent
                  agent={agent}
                  currentJsonSchema={jsonSchema}
                  diagramSlots={diagramSlots}
                  editingDiagramSlot={editingDiagramSlot}
                  editingDiagramName={editingDiagramName}
                  setEditingDiagramSlot={setEditingDiagramSlot}
                  setEditingDiagramName={setEditingDiagramName}
                  handleDiagramSlotUpload={handleDiagramSlotUpload}
                  renameDiagram={renameDiagram}
                  deleteDiagram={deleteDiagram}
                  sharedData={sharedData}
                  activeSchemaId={activeSchemaId}
                  setActiveSchemaId={setActiveSchemaId}
                  expandedSchemaId={expandedSchemaId}
                  setExpandedSchemaId={setExpandedSchemaId}
                  editingSchemaId={editingSchemaId}
                  setEditingSchemaId={setEditingSchemaId}
                  editingSchemaName={editingSchemaName}
                  setEditingSchemaName={setEditingSchemaName}
                  onUseImage={handleUseLibraryImage}
                  onUseSchemaContent={setInput}
                  deleteSchema={deleteSchema}
                  renameSchema={renameSchema}
                />
              </div>
            )}
          </div>

          {/* ── Mobile bottom sheet ── */}
          {isMobileAssetPanelOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={() => setIsMobileAssetPanelOpen(false)}
              />
              {/* Sheet */}
              <div className="relative bg-white rounded-t-2xl max-h-[82vh] flex flex-col shadow-2xl animate-slide-up">
                {/* Handle */}
                <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
                {/* Header */}
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <span className="font-semibold text-gray-800 text-sm">素材库</span>
                  <button
                    onClick={() => setIsMobileAssetPanelOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  <AssetPanelContent
                    agent={agent}
                    currentJsonSchema={jsonSchema}
                    diagramSlots={diagramSlots}
                    editingDiagramSlot={editingDiagramSlot}
                    editingDiagramName={editingDiagramName}
                    setEditingDiagramSlot={setEditingDiagramSlot}
                    setEditingDiagramName={setEditingDiagramName}
                    handleDiagramSlotUpload={handleDiagramSlotUpload}
                    renameDiagram={renameDiagram}
                    deleteDiagram={deleteDiagram}
                    sharedData={sharedData}
                    activeSchemaId={activeSchemaId}
                    setActiveSchemaId={setActiveSchemaId}
                    expandedSchemaId={expandedSchemaId}
                    setExpandedSchemaId={setExpandedSchemaId}
                    editingSchemaId={editingSchemaId}
                    setEditingSchemaId={setEditingSchemaId}
                    editingSchemaName={editingSchemaName}
                    setEditingSchemaName={setEditingSchemaName}
                    onUseImage={handleUseLibraryImage}
                    onUseSchemaContent={setInput}
                    deleteSchema={deleteSchema}
                    renameSchema={renameSchema}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Shared panel content component ───────────────────────────────────────────
interface AssetPanelContentProps {
  agent: Agent;
  currentJsonSchema?: string;
  diagramSlots: (SavedDiagram | null)[];
  editingDiagramSlot: number | null;
  editingDiagramName: string;
  setEditingDiagramSlot: (v: number | null) => void;
  setEditingDiagramName: (v: string) => void;
  handleDiagramSlotUpload: (slotIdx: number) => void;
  renameDiagram?: (slotIdx: number, name: string) => void;
  deleteDiagram?: (slotIdx: number) => void;
  sharedData?: SharedData;
  activeSchemaId: string | null;
  setActiveSchemaId: (v: string | null) => void;
  expandedSchemaId: string | null;
  setExpandedSchemaId: (v: string | null) => void;
  editingSchemaId: string | null;
  setEditingSchemaId: (v: string | null) => void;
  editingSchemaName: string;
  setEditingSchemaName: (v: string) => void;
  onUseImage?: (dataUrl: string, name: string) => void;
  onUseSchemaContent?: (content: string) => void;
  deleteSchema?: (schemaId: string) => void;
  renameSchema?: (schemaId: string, name: string) => void;
}

const AssetPanelContent: React.FC<AssetPanelContentProps> = ({
  agent, currentJsonSchema, diagramSlots, editingDiagramSlot, editingDiagramName,
  setEditingDiagramSlot, setEditingDiagramName, handleDiagramSlotUpload,
  renameDiagram, deleteDiagram, sharedData,
  activeSchemaId, setActiveSchemaId, expandedSchemaId, setExpandedSchemaId,
  editingSchemaId, setEditingSchemaId, editingSchemaName, setEditingSchemaName,
  onUseImage, onUseSchemaContent, deleteSchema, renameSchema,
}) => (
  <div className="flex flex-col">
    {/* ── 图库 ── */}
    <div className="p-3 flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
        图库
      </p>
      <div className="grid grid-cols-1 gap-2">
        {[0, 1, 2].map((slotIdx) => {
          const diagram = diagramSlots[slotIdx];
          const isEditing = editingDiagramSlot === slotIdx;
          return (
            <div
              key={slotIdx}
              className={`rounded-xl border overflow-hidden transition-all ${
                diagram ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50/60'
              }`}
            >
              {diagram ? (
                <>
                  <div className="relative group">
                    <img src={diagram.dataUrl} alt={diagram.name} className="w-full h-28 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2">
                      {onUseImage && (
                        <button
                          onClick={() => onUseImage(diagram.dataUrl, diagram.name)}
                          className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-blue-600/90 hover:bg-blue-700 px-2.5 py-1 rounded-md transition-all shadow-md"
                        >
                          使用
                        </button>
                      )}
                      <button
                        onClick={() => { const w = window.open(); w?.document.write(`<img src="${diagram.dataUrl}" style="max-width:100%;height:auto;"/>`); }}
                        className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium bg-black/50 hover:bg-black/70 px-2 py-1 rounded-md transition-all"
                      >
                        查看
                      </button>
                    </div>
                  </div>
                  <div className="px-2 py-1.5 flex items-center gap-1">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingDiagramName}
                        onChange={(e) => setEditingDiagramName(e.target.value)}
                        onBlur={() => {
                          if (editingDiagramName.trim()) renameDiagram?.(slotIdx, editingDiagramName.trim());
                          setEditingDiagramSlot(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setEditingDiagramSlot(null);
                        }}
                        className="flex-1 text-xs border border-blue-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-0"
                      />
                    ) : (
                      <span className="flex-1 text-xs text-gray-700 font-medium truncate">{diagram.name}</span>
                    )}
                    <button onClick={() => { setEditingDiagramName(diagram.name); setEditingDiagramSlot(slotIdx); }} className="p-1 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0" title="重命名"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => handleDiagramSlotUpload(slotIdx)} className="p-1 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0" title="替换"><Upload className="w-3 h-3" /></button>
                    <button onClick={() => deleteDiagram?.(slotIdx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" title="删除"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => handleDiagramSlotUpload(slotIdx)}
                  className="w-full h-20 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">图 {slotIdx + 1}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* ── 需求 JSON 库 (step2/step3) ── */}
    {['step2', 'step3'].includes(agent.id) && (
      <div className="p-3 pt-0 flex flex-col gap-2">
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mb-1">
            <BookmarkPlus className="w-3.5 h-3.5 text-purple-500" />
            需求 JSON 库
          </p>
          <p className="text-xs text-gray-400 mb-2 leading-relaxed">
            Step2 可保存，Step3 点击<span className="font-semibold text-purple-600">「使用」</span>后发消息自动带入。
          </p>
        </div>
        {agent.id === 'step2' && currentJsonSchema?.trim() && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50">
            <div className="px-3 py-2 text-xs font-semibold text-blue-700 border-b border-blue-100">当前编辑 JSON Schema</div>
            <pre className="text-xs text-gray-700 p-2 overflow-x-auto overflow-y-auto max-h-32 whitespace-pre-wrap break-words font-mono">
              {currentJsonSchema}
            </pre>
          </div>
        )}
        {[0, 1, 2].map((slotIdx) => {
          const schema = sharedData?.savedSchemas?.[slotIdx];
          const isActive = schema && activeSchemaId === schema.id;
          const isExpanded = schema && expandedSchemaId === schema.id;
          const isEditing = schema && editingSchemaId === schema.id;
          return (
            <div
              key={slotIdx}
              className={`rounded-xl border transition-all ${
                schema
                  ? isActive ? 'border-purple-400 bg-purple-50/60 shadow-sm' : 'border-gray-200 bg-white hover:border-purple-200'
                  : 'border-dashed border-gray-200 bg-gray-50/50'
              }`}
            >
              <div className="px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${schema ? (isActive ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-400'}`}>
                    {slotIdx + 1}
                  </span>
                  {schema ? (
                    isEditing ? (
                      <input
                        autoFocus
                        value={editingSchemaName}
                        onChange={(e) => setEditingSchemaName(e.target.value)}
                        onBlur={() => {
                          if (editingSchemaName.trim()) renameSchema?.(schema.id, editingSchemaName.trim());
                          setEditingSchemaId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setEditingSchemaId(null);
                        }}
                        className="text-xs border border-purple-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-400 min-w-0"
                      />
                    ) : (
                      <span className="text-xs text-gray-400 truncate">{schema.name || new Date(schema.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    )
                  ) : <span className="text-xs text-gray-400">空槽位</span>}
                </div>
                {schema && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingSchemaName(schema.name || '');
                        setEditingSchemaId(schema.id);
                      }}
                      className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors"
                      title="重命名"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpandedSchemaId(isExpanded ? null : schema.id)} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => {
                        if (isActive) setActiveSchemaId(null);
                        deleteSchema?.(schema.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const nextIsActive = !isActive;
                        setActiveSchemaId(nextIsActive ? schema.id : null);
                        onUseSchemaContent?.(nextIsActive ? schema.content : '');
                      }}
                      className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all border ${isActive ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700' : 'text-purple-600 border-purple-300 hover:bg-purple-50'}`}
                    >
                      {isActive ? <span className="flex items-center gap-1"><Check className="w-3 h-3" />用中</span> : '使用'}
                    </button>
                  </div>
                )}
              </div>
              {schema && isExpanded && (
                <div className="px-3 pb-3">
                  <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 overflow-x-auto overflow-y-auto max-h-40 whitespace-pre-wrap break-words font-mono border border-gray-100">
                    {schema.content}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default ChatInterface;
