import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, X, Send, Trash2, Sparkles, 
  Bot, User, Loader2, ChevronDown, CornerDownLeft 
} from 'lucide-react';
import { useStore } from '../store';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  'How do I report a new civic issue?',
  'What are rewards and contribution points?',
  'How does community verification work?',
  'What is the difference between Citizen and Officer?'
];

export default function FloatingChatbot() {
  const user = useStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessageBadge, setHasNewMessageBadge] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when user logs in or clears chat
  useEffect(() => {
    const welcomeName = user?.displayName ? `, ${user.displayName.split(' ')[0]}` : '';
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi${welcomeName}! I'm **HeroBot**, your Community Hero AI Assistant. 🚀\n\nI can help you understand how to report issues, track resolutions, verify reports, or explain our gamified reward points system.\n\nWhat would you like to build or solve in your community today?`,
        timestamp: Date.now()
      }
    ]);
  }, [user]);

  // Alert user of new message if chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      setHasNewMessageBadge(true);
    }
  }, [messages, isOpen]);

  // Automatically scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessageId = Math.random().toString(36).substring(7);
    const newUserMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    // Update messages local state
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Format context history for Gemini endpoint (filtering out welcome)
      const chatHistory = updatedMessages
        .filter(msg => msg.id !== 'welcome')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          text: msg.content
        }));

      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory.slice(0, -1) // pass all except current message (sent as 'message')
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const assistantMessageId = Math.random().toString(36).substring(7);
      setMessages(prev => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: data.text || 'Sorry, I did not receive a response from my engine. Please try again.',
          timestamp: Date.now()
        }
      ]);
    } catch (err) {
      console.error('Chatbot error:', err);
      toast.error('Could not reach HeroBot server');
      
      // Fallback message
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Math.random()}`,
          role: 'assistant',
          content: '⚠️ **System Error**: I had trouble connecting to the civic intelligence servers. Please make sure the applet dev server is active.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear your conversation history?')) {
      const welcomeName = user?.displayName ? `, ${user.displayName.split(' ')[0]}` : '';
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi${welcomeName}! Welcome back. Conversation history has been wiped clean. Ask me anything!`,
          timestamp: Date.now()
        }
      ]);
      toast.success('Chat history cleared');
    }
  };

  const formatMessageContent = (text: string) => {
    if (!text) return null;
    
    // Split by lines to render lists and paragraphs correctly
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      let content = line;
      
      // Check if it's a list item
      const isListItem = content.trim().startsWith('- ') || content.trim().startsWith('* ');
      if (isListItem) {
        content = content.replace(/^[-*]\s+/, '');
      }
      
      // Parse **bold** markdown
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const parsedParts = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={partIndex} className="font-bold text-neutral-950">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });
      
      if (isListItem) {
        return (
          <li key={lineIndex} className="ml-4 list-disc text-sm text-neutral-700 leading-relaxed mb-1">
            {parsedParts}
          </li>
        );
      }
      
      return (
        <p key={lineIndex} className="text-sm text-neutral-700 leading-relaxed mb-1.5 min-h-[1px]">
          {parsedParts}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="floating-chatbot-root">
      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="w-[380px] h-[550px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-white border border-neutral-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-4"
            id="chatbot-panel"
          >
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-4 py-3.5 flex items-center justify-between text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="bg-white/15 p-1.5 rounded-lg backdrop-blur-md border border-white/10">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">HeroBot AI</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-[10px] text-emerald-100 font-medium">Platform Assistant</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={handleClearChat}
                    className="p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-colors"
                    title="Clear Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/15 rounded-lg text-emerald-100 hover:text-white transition-colors"
                  title="Minimize"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/50 space-y-4 scrollbar-thin scrollbar-thumb-neutral-200">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200/50 flex items-center justify-center text-emerald-600">
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                  )}
                  
                  <div className="max-w-[78%] flex flex-col">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-neutral-800 border border-neutral-200/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="space-y-1">
                          {formatMessageContent(msg.content)}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-neutral-400 mt-1 px-1 select-none">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <User className="w-4.5 h-4.5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200/50 flex items-center justify-center text-emerald-600 animate-spin">
                    <Loader2 className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-neutral-200/80 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Container */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2.5 bg-white border-t border-neutral-100">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">💡 Quick Questions</p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left text-xs text-neutral-600 hover:text-emerald-700 bg-neutral-50 hover:bg-emerald-50/50 px-3 py-2 rounded-xl border border-neutral-200/60 hover:border-emerald-200 transition-all truncate"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Panel Input Bar */}
            <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-neutral-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask HeroBot a question..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-sm bg-neutral-50 border border-neutral-200 focus:border-emerald-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-emerald-600 flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        drag
        dragConstraints={{ left: -250, right: 0, top: -500, bottom: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMessageBadge(false);
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl cursor-grab active:cursor-grabbing relative transition-all duration-300 ${
          isOpen 
            ? 'bg-neutral-800 hover:bg-neutral-900 border border-neutral-700' 
            : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 ring-4 ring-emerald-500/10'
        }`}
        id="chatbot-toggle-button"
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-none" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>
        )}

        {/* Unread Alert Badge */}
        {hasNewMessageBadge && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold items-center justify-center">!</span>
          </span>
        )}
      </motion.button>
    </div>
  );
}
