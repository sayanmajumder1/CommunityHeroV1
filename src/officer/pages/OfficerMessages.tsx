import React, { useState, useEffect, useRef } from 'react';
import { useStore, getAuthToken } from '../../store';
import { OfficialMessage } from '../../types';
import { 
  Send, Loader2, MessageSquare, Shield, Clock, 
  RefreshCw, Check, CheckCheck, User, Info, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function OfficerMessages() {
  const user = useStore((state) => state.user);
  
  const [messages, setMessages] = useState<OfficialMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (showToast = false) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch('/api/official-messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        setError(null);
        
        // Mark read
        const unreadCount = data.filter(m => m.receiverId === user?.uid && !m.read).length;
        if (unreadCount > 0) {
          await fetch('/api/official-messages/read', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
          });
        }

        if (showToast) {
          toast.success('Messages synchronized');
        }
      }
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Unable to load message inbox.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Authentication required');

      const res = await fetch('/api/official-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: messageText
        })
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to dispatch message');
      }

      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]);
      toast.success('Message dispatched to Administration');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      setInputValue(messageText); // restore text
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-sans max-w-5xl mx-auto" id="officer-messages-workspace">
      
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm shadow-slate-100/50">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
              Internal Comms Node
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Admin Hot-Line
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>Message Box</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Establish communication with administrators for resource requests, audit clarifications, or emergency directives.
          </p>
        </div>

        <button
          onClick={() => fetchMessages(true)}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Comms Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Info & Resource Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-emerald-600" />
              <span>Security Protocols</span>
            </h2>
            
            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              <p className="leading-relaxed">
                This channel connects you directly with the <strong>Administrator Command Center</strong>.
              </p>
              
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-amber-800 text-[11px]">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  All communications logged on this hub are encrypted and visible only to clearing Officers and Portal Super Admins.
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>SLA Reallocations</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>SOP Guidelines Request</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Resource dispatch escalation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messaging Box Panel */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[520px]">
          
          {/* Active Contact Bar */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-white shadow-sm border border-slate-950">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-slate-900">System Administrators</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Gateway Secure</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
            {loading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-xs text-slate-400 font-bold">Connecting to administrators channel...</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <p className="text-xs text-red-600 font-bold">{error}</p>
                <button
                  onClick={() => fetchMessages(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition"
                >
                  Retry Connection
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 max-w-sm mx-auto">
                <MessageSquare className="w-12 h-12 text-slate-300" />
                <p className="text-xs text-slate-500 font-black">No messages exchanged yet</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Dispatch your first message to request assistance or update system parameters.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2.5`}
                  >
                    {!isMe && (
                      <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-900 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        <Shield className="w-4.5 h-4.5 text-emerald-500" />
                      </div>
                    )}

                    <div className="flex flex-col space-y-1 max-w-[75%] text-left">
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[9px] font-black text-slate-800">{msg.senderName}</span>
                        <span className="text-[8px] font-bold text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className={`p-3 rounded-2xl text-xs font-semibold ${
                        isMe 
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-sm' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                      </div>

                      {isMe && (
                        <div className="flex justify-end px-1 items-center gap-0.5 text-slate-400">
                          {msg.read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-slate-300" />
                          )}
                          <span className="text-[8px] font-bold uppercase tracking-wider">
                            {msg.read ? 'Read' : 'Delivered'}
                          </span>
                        </div>
                      )}
                    </div>

                    {isMe && (
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex-shrink-0 flex items-center justify-center text-xs font-bold text-emerald-700 shadow-xs uppercase">
                        {msg.senderName ? msg.senderName[0] : 'O'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Area */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2.5 items-center">
            <input
              type="text"
              required
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message to system administrators..."
              disabled={sending}
              className="flex-1 text-xs font-semibold border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/30"
            />
            <button
              type="submit"
              disabled={sending || !inputValue.trim()}
              className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shrink-0 disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
