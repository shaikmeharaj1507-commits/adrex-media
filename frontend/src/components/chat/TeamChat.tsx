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
  senderName?: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
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

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const loadTeamMessages = async () => {
    setMessages([]);
    setLoading(true);
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/messages/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: any) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName,
          receiverId: m.receiverId,
          content: m.content,
          createdAt: m.createdAt,
          sender: m.sender,
        })));
      }
    } catch (error) {
      console.error('Failed to load team messages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'team') {
      loadTeamMessages();
    } else if (mode === 'private' && selectedUser) {
      selectPrivateChat(selectedUser);
    }
  }, [isOpen, mode, selectedUser]);

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('adrex_token');
      const res = await fetch(`${API_URL}/api/team`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data.filter((m: TeamMember) => m.id !== user?.id));
      }
    } catch (error) {
      console.error('Failed to fetch team members', error);
    }
  };

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
          sender: m.sender,
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
            sender: msg.sender,
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
    if (mode === 'team') return msg.userId === user?.id || msg.senderId === user?.id;
    return msg.senderId === user?.id;
  };

  const getSenderDetails = (msg: ChatMessage) => {
    if (msg.isAI) {
      return {
        name: 'AI Assistant',
        avatar: null,
        role: 'AI',
        initials: 'AI'
      };
    }

    if (isMe(msg)) {
      return {
        name: user ? `${user.firstName} ${user.lastName}` : 'You',
        avatar: user?.avatar || null,
        role: user?.role || 'TEAM_MEMBER',
        initials: user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'
      };
    }

    if (msg.sender) {
      return {
        name: `${msg.sender.firstName} ${msg.sender.lastName}`,
        avatar: msg.sender.avatar || null,
        role: msg.sender.role,
        initials: `${msg.sender.firstName[0]}${msg.sender.lastName[0]}`
      };
    }

    // Fallback search teamMembers
    const senderId = msg.senderId || msg.userId;
    const member = teamMembers.find(m => m.id === senderId);
    if (member) {
      return {
        name: `${member.firstName} ${member.lastName}`,
        avatar: null,
        role: member.role,
        initials: `${member.firstName[0]}${member.lastName[0]}`
      };
    }

    return {
      name: msg.senderName || 'Team Member',
      avatar: null,
      role: 'TEAM_MEMBER',
      initials: msg.senderName ? msg.senderName[0] : 'T'
    };
  };

  const getRoleAccentClasses = (role: string, isMe: boolean) => {
    const isAdmin = role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'ADMIN';
    const isInfluencer = role === 'INFLUENCER';

    if (isMe) {
      if (isInfluencer) {
        return 'bg-secondary text-white rounded-br-none';
      }
      if (isAdmin) {
        return 'bg-primary text-white rounded-br-none';
      }
      return 'bg-muted text-foreground rounded-br-none';
    } else {
      if (isInfluencer) {
        return 'bg-card border border-secondary/25 text-foreground rounded-bl-none';
      }
      if (isAdmin) {
        return 'bg-card border border-primary/25 text-foreground rounded-bl-none';
      }
      return 'bg-card border border-border text-foreground rounded-bl-none';
    }
  };

  const getRoleTextClasses = (role: string) => {
    const isAdmin = role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'ADMIN';
    const isInfluencer = role === 'INFLUENCER';
    if (isInfluencer) return 'text-secondary';
    if (isAdmin) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getRoleBadgeClasses = (role: string) => {
    const isAdmin = role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'ADMIN';
    const isInfluencer = role === 'INFLUENCER';
    if (isInfluencer) return 'text-secondary border-secondary/20 bg-secondary/10';
    if (isAdmin) return 'text-primary border-primary/20 bg-primary/10';
    return 'text-muted-foreground border-border bg-muted';
  };

  const getRoleBadgeLabel = (role: string) => {
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') return 'Admin';
    if (role === 'MANAGER') return 'Manager';
    if (role === 'INFLUENCER') return 'Creator';
    if (role === 'AI') return 'AI';
    return 'Team';
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
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg z-40 ${isOpen ? 'hidden' : 'block'}`}
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
            className="fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {mode === 'private' && selectedUser && (
                  <button onClick={() => { setSelectedUser(null); setMessages([]); fetchTeamMembers(); }} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  {mode === 'team' ? <MessageSquare className="text-primary" size={20} /> :
                   mode === 'private' ? <User className="text-secondary" size={20} /> :
                   <Sparkles className="text-yellow-600" size={20} />}
                </div>
                <div>
                  <h2 className="text-foreground font-bold">
                    {mode === 'team' ? 'Team Chat' : mode === 'private' ? (selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : 'Private Chat') : 'AI Assistant'}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors">
                <Minimize2 size={20} />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex border-b border-border">
              {[
                { id: 'team' as ChatMode, icon: Users, label: 'Team' },
                { id: 'private' as ChatMode, icon: User, label: '1:1' },
                { id: 'ai' as ChatMode, icon: Bot, label: 'AI' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all ${
                    mode === m.id ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              ))}
            </div>

            {/* Private Chat Member List */}
            {mode === 'private' && !selectedUser && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="text-sm text-muted-foreground mb-3">Select a team member to chat with:</p>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No team members found.</p>
                ) : (
                  teamMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => selectPrivateChat(member)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all text-left"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary font-bold">
                          {member.firstName[0]}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${member.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/60'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role.replace(/_/g, ' ').toLowerCase()}</p>
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
                      <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3">
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
                      const sender = getSenderDetails(msg);
                      const me = isMe(msg);
                      return (
                        <div key={msg.id} className={`flex items-end gap-2.5 ${me ? 'justify-end' : 'justify-start'}`}>
                          {/* Avatar for incoming */}
                          {!me && (
                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-primary relative overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 border border-border shadow-sm">
                              {sender.avatar ? (
                                <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{sender.initials}</span>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col gap-1 max-w-[75%]">
                            {/* Message Header (Sender Name, Role Badge, Time) */}
                            <div className={`flex items-center gap-1.5 px-1 ${me ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-xs font-semibold text-foreground">{me ? 'You' : sender.name}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded border font-medium ${getRoleBadgeClasses(sender.role)}`}>
                                {getRoleBadgeLabel(sender.role)}
                              </span>
                              <span className="text-[9px] text-muted-foreground">{getMessageTime(msg)}</span>
                            </div>

                            {/* Message Bubble */}
                            <div className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all ${getRoleAccentClasses(sender.role, me)}`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{getMessageText(msg)}</p>
                            </div>
                          </div>

                          {/* Avatar for outgoing */}
                          {me && (
                            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white relative overflow-hidden bg-primary border border-primary/20 shadow-sm">
                              {sender.avatar ? (
                                <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{sender.initials}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                 <div className="p-4 border-t border-border bg-muted/40">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={mode === 'ai' ? 'Ask AI assistant...' : 'Type a message...'}
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
                      disabled={!isConnected && mode !== 'ai'}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || (!isConnected && mode !== 'ai')}
                      className="bg-primary hover:opacity-95 text-white w-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
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
