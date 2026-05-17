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
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
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
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isMe ? 'bg-purple-600 text-white rounded-br-sm' : 'bg-zinc-800 text-white border border-white/5 rounded-bl-sm'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] text-right mt-1 opacity-60">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
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
