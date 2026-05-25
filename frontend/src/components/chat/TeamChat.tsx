'use client';

import { API_URL } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, Minimize2, Users, User, Bot, Sparkles, ArrowLeft } from 'lucide-react';
import { useSocketStore } from '@/store/socketStore';
import { useAuthStore } from '@/store/authStore';

interface ChatMessage {
  id: string;
  userId?: string;
  senderId?: string;
  receiverId?: string;
  text?: string;
  content?: string;
  timestamp?: string;
  createdAt?: string;
  isAI?: boolean;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

type ChatMode = 'team' | 'private' | 'ai';

export default function TeamChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('team');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useSocketStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket) return;

    const handleTeamMessage = (msg: ChatMessage) => {
      if (mode === 'team') {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    const handlePrivateMessage = (msg: ChatMessage) => {
      if (mode === 'private' && selectedUser && (msg.senderId === selectedUser.id || msg.receiverId === selectedUser.id)) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };

    socket.on('receive_team_message', handleTeamMessage);
    socket.on('receive_private_message', handlePrivateMessage);

    return () => {
      socket.off('receive_team_message', handleTeamMessage);
      socket.off('receive_private_message', handlePrivateMessage);
    };
  }, [socket, mode, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllMembers(data);
        setTeamMembers(data.filter((m: TeamMember) => m.id !== user?.id));
      }
    } catch (error) {
      console.error('Failed to fetch team members', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const selectPrivateChat = async (member: TeamMember) => {
    setSelectedUser(member);
    setMessages([]);
    setLoading(true);

    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/messages/${member.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          content: m.content,
          createdAt: m.createdAt,
        })));
      }
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (mode === 'team') {
      if (!socket || !isConnected) return;
      socket.emit('send_team_message', { text: input });
      setInput('');
    } else if (mode === 'private' && selectedUser) {
      const token = localStorage.getItem('adrex_token');
      try {
        const res = await fetch(`${API_URL}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ receiverId: selectedUser.id, content: input }),
        });
        if (res.ok) {
          const msg = await res.json();
          setMessages(prev => [...prev, {
            id: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            content: msg.content,
            createdAt: msg.createdAt,
          }]);
          if (socket && isConnected) {
            socket.emit('send_private_message', { receiverId: selectedUser.id, content: input });
          }
          setInput('');
        }
      } catch (error) {
        console.error('Failed to send message', error);
      }
    } else if (mode === 'ai') {
      const userMessage: ChatMessage = { id: Date.now().toString(), text: input, timestamp: new Date().toISOString(), userId: 'me' };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      try {
        const token = localStorage.getItem('adrex_token');
        const res = await fetch(`${API_URL}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ prompt: input }),
        });
        const data = await res.json();
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: data.result || data.response || 'Sorry, I could not process that.',
          timestamp: new Date().toISOString(),
          userId: 'ai',
          isAI: true,
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: 'Failed to connect to AI assistant.',
          timestamp: new Date().toISOString(),
          userId: 'ai',
          isAI: true,
        }]);
      }
    }
  };

  const getMessageText = (msg: ChatMessage) => msg.text || msg.content || '';
  const getMessageTime = (msg: ChatMessage) => {
    const time = msg.timestamp || msg.createdAt;
    return time ? new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  };
  const isMe = (msg: ChatMessage) => {
    if (mode === 'team') return msg.userId === user?.id;
    return msg.senderId === user?.id;
  };

  const openChat = () => {
    setIsOpen(true);
    if (mode === 'private' && !selectedUser) {
      fetchTeamMembers();
    }
  };

  const switchMode = (newMode: ChatMode) => {
    setMode(newMode);
    if (newMode === 'private') {
      setSelectedUser(null);
      setMessages([]);
      fetchTeamMembers();
    } else {
      setSelectedUser(null);
      setMessages([]);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={openChat}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center shadow-2xl z-40 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageSquare size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-[420px] bg-zinc-950/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-white/10 bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mode === 'private' && selectedUser && (
                  <button onClick={() => { setSelectedUser(null); setMessages([]); fetchTeamMembers(); }} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  {mode === 'team' ? <MessageSquare className="text-purple-400" size={20} /> :
                   mode === 'private' ? <User className="text-blue-400" size={20} /> :
                   <Sparkles className="text-amber-400" size={20} />}
                </div>
                <div>
                  <h2 className="text-white font-bold">
                    {mode === 'team' ? 'Team Chat' : mode === 'private' ? (selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Private Chat') : 'AI Assistant'}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-zinc-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 transition-colors">
                <Minimize2 size={20} />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex border-b border-white/10">
              {[
                { id: 'team' as ChatMode, icon: Users, label: 'Team' },
                { id: 'private' as ChatMode, icon: User, label: '1:1' },
                { id: 'ai' as ChatMode, icon: Bot, label: 'AI' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
                    mode === m.id ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>

            {/* Private Chat Member List */}
            {mode === 'private' && !selectedUser && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-sm text-zinc-400 mb-3">Select a team member to chat with:</p>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">No team members found.</p>
                ) : (
                  teamMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => selectPrivateChat(member)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-300 font-bold">
                          {member.firstName[0]}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${member.isActive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-zinc-500 capitalize">{member.role.replace(/_/g, ' ').toLowerCase()}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Messages Area */}
            {(mode !== 'private' || selectedUser) && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 size={24} className="animate-spin text-purple-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
                      {mode === 'team' ? <MessageSquare size={48} className="opacity-20" /> :
                       mode === 'ai' ? <Sparkles size={48} className="opacity-20" /> :
                       <User size={48} className="opacity-20" />}
                      <p className="text-sm text-center max-w-[200px]">
                        {mode === 'team' ? 'This is the beginning of your agency\'s team chat.' :
                         mode === 'ai' ? 'Ask me anything about your agency, campaigns, or tasks.' :
                         `Start a conversation with ${selectedUser?.firstName}`}
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const msgMe = isMe(msg);
                      const sender = allMembers.find((m) => m.id === msg.userId || m.id === msg.senderId);
                      const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Team Member';

                      return (
                        <div key={msg.id} className={`flex flex-col ${msgMe ? 'items-end' : 'items-start'}`}>
                          {mode === 'team' && !msgMe && (
                            <span className="text-[10px] text-zinc-500 mb-1 ml-2 font-medium">
                              {senderName}
                            </span>
                          )}
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                            msg.isAI ? 'bg-amber-600/20 border border-amber-500/30 text-white rounded-bl-sm' :
                            msgMe ? 'bg-purple-600 text-white rounded-br-sm' :
                            'bg-zinc-800 text-white border border-white/5 rounded-bl-sm'
                          }`}>
                            {msg.isAI && <p className="text-xs text-amber-400 font-medium mb-1">AI Assistant</p>}
                            <p className="text-sm">{getMessageText(msg)}</p>
                            <p className="text-[10px] text-right mt-1 opacity-60">{getMessageTime(msg)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/10 bg-zinc-900/50">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={mode === 'ai' ? 'Ask AI assistant...' : 'Type a message...'}
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      disabled={!isConnected && mode !== 'ai'}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || (!isConnected && mode !== 'ai')}
                      className="bg-purple-600 hover:bg-purple-500 text-white w-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
