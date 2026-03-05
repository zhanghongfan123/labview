import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import axios from 'axios';
import { Send, Paperclip, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { type Message, type Agent } from '../types';

interface ChatInterfaceProps {
  agent: Agent;
}

interface MessageContentProps {
  content: string;
}

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  if (!content.includes('<think>')) {
    return <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>;
  }

  const parts = [];
  let currentText = content;
  
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

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'think') {
          return (
             <details key={index} className="mb-2 rounded-lg overflow-hidden border border-blue-100 bg-blue-50/50 group">
               <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-blue-600 select-none hover:bg-blue-100/50 transition-colors flex items-center gap-2 list-none">
                 <span className="opacity-70">💭 思考过程 (点击展开)</span>
               </summary>
               <div className="p-3 text-gray-600 text-xs border-t border-blue-100/50 bg-white/50">
                 <ReactMarkdown rehypePlugins={[rehypeRaw]}>{part.content}</ReactMarkdown>
               </div>
             </details>
          );
        }
        return <ReactMarkdown key={index} rehypePlugins={[rehypeRaw]}>{part.content}</ReactMarkdown>;
      })}
    </>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [conversationId, setConversationId] = useState<string>('');
  
  // State for Step 2 inputs
  const [jsonSchema, setJsonSchema] = useState('');
  const [requestInput, setRequestInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages and conversationId from local server and localStorage
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await axios.get(`/api/history/${agent.id}`);
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setMessages(response.data);
        } else {
          // Default welcome message if no history exists
          setMessages([
            {
              id: `welcome-${agent.id}`,
              role: 'assistant',
              content: `你好！我是 **${agent.name}** 助手。${agent.description}。请问有什么可以帮您？`,
              timestamp: Date.now(),
            },
          ]);
        }
      } catch (error) {
        console.error('Failed to load history from server:', error);
        // Fallback to localStorage if server fails
        const savedMessages = localStorage.getItem(`chat_history_${agent.id}`);
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          setMessages([
            {
              id: `welcome-${agent.id}`,
              role: 'assistant',
              content: `你好！我是 **${agent.name}** 助手。${agent.description}。请问有什么可以帮您？`,
              timestamp: Date.now(),
            },
          ]);
        }
      }
    };

    loadHistory();

    const savedConversationId = localStorage.getItem(`chat_conversation_id_${agent.id}`);
    
    if (savedConversationId) {
      setConversationId(savedConversationId);
    } else {
      setConversationId('');
    }

    setSelectedFile(null);
    setInput('');
    setJsonSchema('');
    setRequestInput('');
  }, [agent]);

  // Save messages to local server and localStorage
  useEffect(() => {
    const saveHistory = async () => {
      if (messages.length > 0) {
        // Save to localStorage as backup/fast access
        localStorage.setItem(`chat_history_${agent.id}`, JSON.stringify(messages));
        
        // Save to local server
        try {
          await axios.post(`/api/history/${agent.id}`, messages);
        } catch (error) {
          console.error('Failed to save history to server:', error);
        }
      }
    };

    // Debounce saving to avoid too many requests during streaming
    const timeoutId = setTimeout(saveHistory, 1000);
    return () => clearTimeout(timeoutId);
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
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    let userContent = input;
    if (!userContent.trim() && selectedFile) {
      userContent = `[文件上传] ${selectedFile.name}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!agent.apiKey) {
        throw new Error('API key not configured for this agent');
      }

      // Prepare payload for Dify API
      const payload: any = {
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
            payload.files = [
              {
                type: 'image',
                transfer_method: 'local_file',
                upload_file_id: uploadResponse.data.id,
              },
            ];
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
         // Validation: Must have file on first turn (unless user says otherwise, but we enforce it here based on previous requests)
         if (!conversationId && !hasFile) {
            const errorMessage: Message = {
               id: Date.now().toString(),
               role: 'assistant',
               content: `请上传面板截图（与第一步相同的图片），以便进行需求确认。`,
               timestamp: Date.now(),
             };
             setMessages((prev) => [...prev, errorMessage]);
             setIsLoading(false);
             return;
         }
 
         // Use manual inputs for Step 2
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
        // No specific inputs required
      }
      else if (agent.id === 'step4') {
        // Step 4: inputs: { sd: file }
        // Validation: Must have file on first turn
        if (!conversationId && !hasFile) {
           const errorMessage: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `请上传面板截图以便生成测试方案。`,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setIsLoading(false);
            return;
        }
        if (hasFile) {
           payload.inputs['sd'] = {
               type: 'image',
               transfer_method: 'local_file',
               upload_file_id: fileId
           };
        }
      }
      else if (agent.id === 'help') {
        // Help: inputs: {} (Empty)
      }

      // Streaming request using fetch instead of axios for better stream handling
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${agent.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessageContent = '';
      
      // Create a placeholder message for the assistant
      const assistantMessageId = Date.now().toString();
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
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
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
          content: `你好！我是 **${agent.name}** 助手。${agent.description}。请问有什么可以帮您？`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">{agent.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{agent.description}</p>
          </div>
          <button
            onClick={handleClearHistory}
            className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
            title="清除历史记录"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-6 py-4 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                <div className={`prose ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'} max-w-none text-sm leading-relaxed`}>
                  <MessageContent content={msg.content} />
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm flex items-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span className="text-sm font-medium">正在思考中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-white border-t border-gray-200 p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
          {selectedFile && (
            <div className="mb-3 flex items-center gap-2 bg-blue-50 p-2.5 rounded-lg text-sm text-blue-700 max-w-max border border-blue-100 animate-slide-up">
              <ImageIcon className="w-4 h-4" />
              <span className="font-medium truncate max-w-[200px]">{selectedFile.name}</span>
              <button 
                onClick={() => setSelectedFile(null)}
                className="ml-2 text-blue-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"
              >
                &times;
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
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
              className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-100"
              title="上传文件"
            >
              <Paperclip className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={`发送给 ${agent.name}... (Shift + Enter 换行)`}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm resize-none min-h-[50px] max-h-[150px]"
                rows={1}
                style={{ height: 'auto', minHeight: '50px' }} 
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedFile)}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md shadow-blue-200"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </div>

      {agent.id === 'step2' && (
        <div className="w-1/3 min-w-[320px] max-w-[450px] border-l border-gray-200 bg-gray-50/50 backdrop-blur-sm p-6 flex flex-col gap-6 overflow-y-auto shadow-inner">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            <h3 className="font-bold text-gray-800 text-lg">需求确认参数配置</h3>
          </div>
          
          <div className="flex flex-col gap-3 group">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              JSON Schema
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
            </label>
            <textarea
              value={jsonSchema}
              onChange={(e) => setJsonSchema(e.target.value)}
              placeholder='{ "type": "object", ... }'
              className="w-full h-48 p-4 border border-gray-300 rounded-xl text-sm font-mono bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:border-gray-400 resize-y"
            />
          </div>

          <div className="flex flex-col gap-3 group">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Request (用户输入)
              <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
            </label>
            <textarea
              value={requestInput}
              onChange={(e) => setRequestInput(e.target.value)}
              placeholder="请输入具体的需求描述..."
              className="w-full h-48 p-4 border border-gray-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:border-gray-400 resize-y"
            />
          </div>
          
          <div className="mt-auto bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="text-blue-800 font-medium text-sm mb-1">💡 操作提示</h4>
            <p className="text-xs text-blue-600 leading-relaxed">
              请在左侧聊天窗口上传面板截图。此处配置的参数将与图片一起发送给 AI 助手进行分析。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
