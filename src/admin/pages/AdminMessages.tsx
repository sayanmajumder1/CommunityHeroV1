import React, { useState, useEffect, useRef } from 'react';
import { useStore, getAuthToken, UserProfile } from '../../store';
import { OfficialMessage } from '../../types';
import { 
  Send, Loader2, MessageSquare, Shield, Clock, Search,
  RefreshCw, Check, CheckCheck, User, Info, AlertTriangle, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminMessages() {
  const adminUser = useStore((state) => state.user);
  
  // States
  const [officers, setOfficers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<OfficialMessage[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<UserProfile | null>(null);
  
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOfficers();
    fetchMessages();

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchOfficers(false);
      fetchMessages(false);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedOfficer]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchOfficers = async (showLoading = true) => {
    if (showLoading) setLoadingOfficers(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to load user directories');
      
      const allUsers = await res.json();
      if (Array.isArray(allUsers)) {
        // Filter for Officers
        const filteredOfficers = allUsers.filter((u: any) => u.role === 'Officer');
        setOfficers(filteredOfficers);
      }
    } catch (err: any) {
      console.error('Error fetching officers:', err);
      setError(err.message || 'Failed to sync municipal officer directories');
    } finally {
      setLoadingOfficers(false);
    }
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

      if (!res.ok) throw new Error('Failed to retrieve messages');

      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
        
        // If we have an active selection, mark their incoming messages to admin as read
        if (selectedOfficer) {
          const unreadFromActive = data.filter(
            m => m.senderId === selectedOfficer.uid && m.receiverId === 'Admin' && !m.read
          );
          
          if (unreadFromActive.length > 0) {
            await fetch('/api/official-messages/read', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ senderId: selectedOfficer.uid })
            });
          }
        }

        if (showToast) {
          toast.success('Admin inbox synchronized');
        }
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSelectOfficer = async (officer: UserProfile) => {
    setSelectedOfficer(officer);
    setLoadingMessages(true);
    
    try {
      // Fetch messages & trigger read update for this officer
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch('/api/official-messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
          
          // Trigger read API call
          await fetch('/api/official-messages/read', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ senderId: officer.uid })
          });
        }
      }
    } catch (err) {
      console.error('Error selecting officer:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || sending || !selectedOfficer) return;

    const textToSend = inputValue.trim();
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
          content: textToSend,
          receiverId: selectedOfficer.uid
        })
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Failed to dispatch reply');
      }

      const newMsg = await res.json();
      setMessages(prev => [...prev, newMsg]);
      toast.success(`Reply dispatched to ${selectedOfficer.displayName}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      setInputValue(textToSend);
    } finally {
      setSending(false);
    }
  };

  // Get conversation count for badge metrics
  const getUnreadCountForOfficer = (officerId: string) => {
    return messages.filter(m => m.senderId === officerId && m.receiverId === 'Admin' && !m.read).length;
  };

  const getLatestMessageText = (officerId: string) => {
    const thread = messages.filter(
      m => (m.senderId === officerId && m.receiverId === 'Admin') || 
           (m.senderId === adminUser?.uid && m.receiverId === officerId)
    );
    if (thread.length === 0) return 'No conversation yet';
    const last = thread[thread.length - 1];
    return last.content;
  };

  // Filters
  const filteredOfficers = officers.filter(o => 
    o.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.email && o.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Active chat thread
  const activeChatMessages = selectedOfficer
    ? messages.filter(
        m => (m.senderId === selectedOfficer.uid && m.receiverId === 'Admin') ||
             (m.senderId === adminUser?.uid && m.receiverId === selectedOfficer.uid)
      )
    : [];

  return (
    <div className="space-y-6 text-left font-sans" id="admin-messages-workspace">
      
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm shadow-slate-100/50">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
              Administration Portal
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" /> Internal Direct-Line
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>Officer Communications Desk</span>
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Oversee, filter, and reply to official inquiries, resource requests, and clearance requests sent by operational officers.
          </p>
        </div>

        <button
          onClick={() => {
            fetchOfficers(true);
            fetchMessages(true);
          }}
          disabled={loadingOfficers}
          className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingOfficers ? 'animate-spin' : ''}`} />
          <span>Sync Hub</span>
        </button>
      </div>

      {/* Main Grid: Left Officer List, Right Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[580px]">
        
        {/* Left Side: Officers Sidebar */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col h-full shadow-sm">
          
          {/* Search box */}
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Filter officers by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Officers List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loadingOfficers ? (
              <div className="h-full flex flex-col items-center justify-center space-y-2 py-12">
                <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                <p className="text-[10px] text-slate-400 font-bold">Retrieving officers index...</p>
              </div>
            ) : filteredOfficers.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <User className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-black">No officers found</p>
              </div>
            ) : (
              filteredOfficers.map((off) => {
                const isSelected = selectedOfficer?.uid === off.uid;
                const unread = getUnreadCountForOfficer(off.uid);
                const latestText = getLatestMessageText(off.uid);

                return (
                  <button
                    key={off.uid}
                    onClick={() => handleSelectOfficer(off)}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all border cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-950 text-white shadow-md shadow-slate-900/10' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {off.displayName ? off.displayName[0].toUpperCase() : 'O'}
                      </div>

                      <div className="min-w-0 text-left">
                        <p className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {off.displayName}
                        </p>
                        <p className={`text-[10px] font-bold mt-0.5 truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {latestText}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 pl-2">
                      {unread > 0 && (
                        <span className="h-4.5 min-w-4.5 px-1.5 bg-emerald-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-sm">
                          {unread}
                        </span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* Right Side: Conversation Box */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full">
          
          {selectedOfficer ? (
            <>
              {/* Selected Officer details */}
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-sm text-slate-700 shadow-xs">
                    {selectedOfficer.displayName ? selectedOfficer.displayName[0].toUpperCase() : 'O'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900">{selectedOfficer.displayName}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 truncate">{selectedOfficer.email}</span>
                    </div>
                  </div>
                </div>

                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                  {selectedOfficer.departmentId || 'Operations Officer'}
                </span>
              </div>

              {/* Chat timeline flows */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    <p className="text-xs text-slate-400 font-bold">Synchronizing active logs...</p>
                  </div>
                ) : activeChatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                    <MessageSquare className="w-10 h-10 text-slate-300" />
                    <p className="text-xs text-slate-400 font-black">Conversation is blank</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      Send an operational update or dispatch guidelines to this officer using the interface below.
                    </p>
                  </div>
                ) : (
                  activeChatMessages.map((msg) => {
                    const isMe = msg.senderId === adminUser?.uid;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2.5`}
                      >
                        {!isMe && (
                          <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-700 shadow-xs uppercase">
                            {msg.senderName ? msg.senderName[0] : 'O'}
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
                              ? 'bg-slate-900 text-white rounded-br-none shadow-sm' 
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
                          <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-950 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                            <Shield className="w-4.5 h-4.5 text-emerald-500" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input footer */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex gap-2.5 items-center">
                <input
                  type="text"
                  required
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Send direct response to ${selectedOfficer.displayName}...`}
                  disabled={sending}
                  className="flex-1 text-xs font-semibold border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 bg-slate-50/30"
                />
                <button
                  type="submit"
                  disabled={sending || !inputValue.trim()}
                  className="p-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl transition shrink-0 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3.5">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-300">
                <MessageSquare className="w-12 h-12" />
              </div>
              <h3 className="text-sm font-black text-slate-900">No Officer Selected</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-xs mx-auto leading-relaxed">
                Choose an active operational officer from the left panel directory to inspect and engage in high-speed, secure, real-time communications.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
