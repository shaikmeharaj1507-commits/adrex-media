'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Search, MessageSquare, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';
import { api } from '@/lib/api';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  };
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocketStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.team.getMembers().then(data => {
      if (Array.isArray(data)) setMembers(data.filter((m: TeamMember) => m.id !== user?.id));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!socket) return;

    const handlePrivateMessage = (msg: ChatMessage) => {
      if (selectedUser && (msg.senderId === selectedUser.id || msg.receiverId === selectedUser.id)) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('receive_private_message', handlePrivateMessage);
    return () => { socket.off('receive_private_message', handlePrivateMessage); };
  }, [socket, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectUser = async (member: TeamMember) => {
    setSelectedUser(member);
    try {
      const msgs = await api.messages.getMessages(member.id);
      if (Array.isArray(msgs)) setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser || !user) return;

    setSending(true);
    try {
      const res = await api.messages.send(selectedUser.id, input);
      if (res) {
        setMessages(prev => [...prev, res]);
        setInput('');

        if (socket && isConnected) {
          socket.emit('send_private_message', {
            receiverId: selectedUser.id,
            content: input,
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  };

  const getSenderDetails = (msg: ChatMessage) => {
    if (msg.senderId === user?.id) {
      return {
        name: user ? `${user.firstName} ${user.lastName}` : 'You',
        avatar: (user as any).avatar || null,
        role: user.role || 'TEAM_MEMBER',
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

    if (selectedUser) {
      return {
        name: `${selectedUser.firstName} ${selectedUser.lastName}`,
        avatar: null,
        role: selectedUser.role,
        initials: `${selectedUser.firstName[0]}${selectedUser.lastName[0]}`
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
        return 'bg-purple-600/90 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-white rounded-br-none';
      }
      if (isAdmin) {
        return 'bg-blue-600/90 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white rounded-br-none';
      }
      return 'bg-zinc-700/90 border border-zinc-600 text-white rounded-br-none';
    } else {
      if (isInfluencer) {
        return 'bg-zinc-900 border border-purple-500/30 text-zinc-100 shadow-[0_0_10px_rgba(168,85,247,0.05)] rounded-bl-none';
      }
      if (isAdmin) {
        return 'bg-zinc-900 border border-blue-500/30 text-zinc-100 shadow-[0_0_10px_rgba(59,130,246,0.05)] rounded-bl-none';
      }
      return 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none';
    }
  };

  const getRoleBadgeClasses = (role: string) => {
    const isAdmin = role === 'SUPER_ADMIN' || role === 'MANAGER' || role === 'ADMIN';
    const isInfluencer = role === 'INFLUENCER';
    if (isInfluencer) return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
    if (isAdmin) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    return 'text-zinc-500 border-zinc-800 bg-zinc-900/50';
  };

  const getRoleBadgeLabel = (role: string) => {
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') return 'Admin';
    if (role === 'MANAGER') return 'Manager';
    if (role === 'INFLUENCER') return 'Creator';
    return 'Team';
  };

  const filteredMembers = members.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Members List */}
      <div className="w-80 glassmorphism rounded-2xl flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Users size={18} className="text-purple-400" /> Team Members
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={24} className="animate-spin text-purple-500" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-8">No members found</p>
          ) : (
            filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => selectUser(member)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  selectedUser?.id === member.id ? 'bg-purple-500/15 border border-purple-500/25' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-300 font-bold">
                    {member.firstName[0]}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900 ${member.isActive ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-zinc-500 capitalize">{member.role.replace(/_/g, ' ').toLowerCase()}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glassmorphism rounded-2xl flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-300 font-bold">
                {selectedUser.firstName[0]}
              </div>
              <div>
                <h3 className="font-semibold text-white">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-zinc-400">{isConnected ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
                  <MessageSquare size={48} className="opacity-20" />
                  <p className="text-sm text-center">Start a conversation with {selectedUser.firstName}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const sender = getSenderDetails(msg);
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {/* Avatar for incoming */}
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white relative overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 shadow-md">
                          {sender.avatar ? (
                            <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{sender.initials}</span>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 max-w-[70%]">
                        {/* Message Header (Sender Name, Role Badge, Time) */}
                        <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs font-semibold text-zinc-200">{isMe ? 'You' : sender.name}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded border font-medium ${getRoleBadgeClasses(sender.role)}`}>
                            {getRoleBadgeLabel(sender.role)}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Message Bubble */}
                        <div className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all ${getRoleAccentClasses(sender.role, isMe)}`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>

                      {/* Avatar for outgoing */}
                      {isMe && (
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white relative overflow-hidden bg-gradient-to-br from-purple-600/30 to-purple-800/30 border border-purple-500/30 shadow-md">
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

            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={sending || !input.trim() || !isConnected}
                className="bg-purple-600 hover:bg-purple-500 text-white w-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <MessageSquare size={64} className="opacity-10 mb-4" />
            <p className="text-lg font-medium">Select a team member to start chatting</p>
            <p className="text-sm mt-1">Choose from the list on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
