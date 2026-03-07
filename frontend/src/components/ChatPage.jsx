import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/App';
import { MessageSquare, Send, ArrowLeft, User, Search, Image, X, Plus, Building2, Wrench, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChatPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const imageInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const toUserId = searchParams.get('to');
  const projectId = searchParams.get('project');

  useEffect(() => {
    if (!user || !token) { navigate('/login'); return; }
    fetchConversations();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, token]);

  useEffect(() => {
    if (toUserId && token) startConversation(toUserId, projectId);
  }, [toUserId, projectId, token]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      setConversations(res.data.conversations);
    } catch {}
    setLoading(false);
  };

  const startConversation = async (otherId, projId) => {
    try {
      const userRes = await axios.get(`${API}/user/${otherId}/basic`);
      setOtherUser(userRes.data);
      const sortedIds = [user.id, otherId].sort();
      let convId = `${sortedIds[0]}_${sortedIds[1]}`;
      if (projId) convId = `${convId}_${projId}`;
      setActiveConversation(convId);
      fetchMessages(convId);
      setShowNewChat(false);
    } catch { toast.error('Потребителят не е намерен'); }
  };

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const res = await axios.get(`${API}/messages/${convId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(res.data.messages);
      if (res.data.messages.length > 0 && !otherUser) {
        const msg = res.data.messages[0];
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        try {
          const userRes = await axios.get(`${API}/user/${otherId}/basic`);
          setOtherUser(userRes.data);
        } catch {}
      }
    } catch { setMessages([]); }
  }, [token, user, otherUser]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeConversation) {
      pollRef.current = setInterval(() => fetchMessages(activeConversation), 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConversation, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // User search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!userSearch || userSearch.length < 2) { setSearchResults([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`${API}/users/search?q=${encodeURIComponent(userSearch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data.users || []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 400);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [userSearch, token]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Файлът е прекалено голям (макс. 5MB)'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imagePreview) || sending) return;
    const receiverId = otherUser?.id || toUserId;
    if (!receiverId) return;
    setSending(true);
    try {
      const res = await axios.post(`${API}/messages`, {
        receiver_id: receiverId, content: newMessage,
        image: imagePreview || null, project_id: projectId || null
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessages(prev => [...prev, res.data]);
      setNewMessage(''); setImagePreview(null);
      if (!activeConversation) setActiveConversation(res.data.conversation_id);
      fetchConversations();
    } catch (err) { toast.error(err.response?.data?.detail || 'Грешка при изпращане'); }
    setSending(false);
  };

  const openConversation = (conv) => {
    setActiveConversation(conv.conversation_id);
    setOtherUser(conv.other_user);
    fetchMessages(conv.conversation_id);
    setShowNewChat(false);
  };

  const startChatWithUser = (u) => {
    setOtherUser(u);
    const sortedIds = [user.id, u.id].sort();
    const convId = `${sortedIds[0]}_${sortedIds[1]}`;
    setActiveConversation(convId);
    fetchMessages(convId);
    setShowNewChat(false);
    setUserSearch('');
    setSearchResults([]);
  };

  const getUserTypeIcon = (type) => {
    if (type === 'company') return <Building2 className="h-3 w-3" />;
    if (type === 'master') return <Wrench className="h-3 w-3" />;
    return <User className="h-3 w-3" />;
  };

  const getUserTypeLabel = (type) => {
    if (type === 'company') return 'Фирма';
    if (type === 'master') return 'Майстор';
    return 'Клиент';
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{background: "var(--theme-bg-secondary)"}} data-testid="chat-page">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
            <MessageSquare className="h-6 w-6 text-[#FF8C42]" />
            Съобщения
          </h1>
          <Button onClick={() => setShowNewChat(!showNewChat)} className="bg-[#FF8C42] hover:bg-[#e67a30]" data-testid="new-chat-btn">
            <Plus className="h-4 w-4 mr-2" /> Нов разговор
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations sidebar */}
          <Card className="md:col-span-1 overflow-hidden flex flex-col" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
            <CardHeader className="py-3 px-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <CardTitle className="text-base" style={{ color: 'var(--theme-text)' }}>Разговори</CardTitle>
            </CardHeader>

            {/* New chat search */}
            {showNewChat && (
              <div className="p-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Търси потребител по име..."
                    className="pl-9"
                    data-testid="user-search-input"
                    autoFocus
                  />
                </div>
                {searching && <p className="text-xs mt-2" style={{ color: 'var(--theme-text-muted)' }}>Търсене...</p>}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {searchResults.map(u => (
                      <button key={u.id} onClick={() => startChatWithUser(u)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-[#FF8C42]/10 transition-colors flex items-center gap-3"
                        data-testid={`search-result-${u.id}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#FF8C42]/10 text-[#FF8C42] text-sm">
                            {u.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--theme-text)' }}>{u.name}</p>
                          <div className="flex items-center gap-1">
                            {getUserTypeIcon(u.user_type)}
                            <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                              {getUserTypeLabel(u.user_type)}
                              {u.city && ` · ${u.city}`}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {userSearch.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-xs mt-2" style={{ color: 'var(--theme-text-muted)' }}>Няма намерени потребители</p>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center" style={{ color: 'var(--theme-text-muted)' }}>Зареждане...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center" style={{ color: 'var(--theme-text-muted)' }}>
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Нямате съобщения</p>
                  <p className="text-xs mt-1">Натиснете "Нов разговор" за да започнете</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button key={conv.conversation_id} onClick={() => openConversation(conv)}
                    className="w-full text-left p-4 border-b transition-colors hover:opacity-80"
                    style={{
                      borderColor: 'var(--theme-border)',
                      background: activeConversation === conv.conversation_id ? 'rgba(249,115,22,0.08)' : 'transparent',
                      borderLeft: activeConversation === conv.conversation_id ? '4px solid #F97316' : '4px solid transparent',
                    }}
                    data-testid={`conversation-${conv.conversation_id}`}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#FF8C42]/10 text-[#FF8C42]">
                          {conv.other_user.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate" style={{ color: 'var(--theme-text)' }}>{conv.other_user.name}</span>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-orange-600 text-white text-xs ml-2">{conv.unread_count}</Badge>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>{conv.last_message}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {getUserTypeLabel(conv.other_user.user_type)}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Chat area */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden" style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
            {activeConversation || toUserId ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--theme-border)' }}>
                  <Button variant="ghost" size="sm" className="md:hidden" onClick={() => { setActiveConversation(null); setOtherUser(null); }}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[#FF8C42]/10 text-[#FF8C42]">
                      {otherUser?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm" style={{ color: 'var(--theme-text)' }}>{otherUser?.name || 'Зареждане...'}</h3>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--theme-text-muted)' }}>
                      {getUserTypeIcon(otherUser?.user_type)}
                      {getUserTypeLabel(otherUser?.user_type)}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: 'var(--theme-bg)' }}>
                  {messages.length === 0 && (
                    <div className="text-center py-12" style={{ color: 'var(--theme-text-muted)' }}>
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Започнете разговора</p>
                    </div>
                  )}
                  {messages.map(msg => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isMine ? 'bg-[#F97316] text-white rounded-br-md' : 'rounded-bl-md'
                        }`} style={!isMine ? { background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' } : {}}>
                          {msg.image && (
                            <img src={msg.image} alt="Снимка" className="max-w-full rounded-lg mb-2 max-h-64 object-contain cursor-pointer"
                              onClick={() => window.open(msg.image, '_blank')} />
                          )}
                          {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-orange-200' : ''}`} style={!isMine ? { color: 'var(--theme-text-subtle)' } : {}}>
                            {new Date(msg.created_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image preview */}
                {imagePreview && (
                  <div className="px-3 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Преглед" className="h-20 rounded-lg object-cover" />
                      <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message input */}
                <div className="p-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <form onSubmit={handleSend} className="flex gap-2">
                    <button type="button" onClick={() => imageInputRef.current?.click()}
                      className="p-2 transition-colors hover:text-[#FF8C42]" style={{ color: 'var(--theme-text-muted)' }} data-testid="chat-image-btn">
                      <Image className="h-5 w-5" />
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Напишете съобщение..." className="flex-1" maxLength={2000} data-testid="message-input" />
                    <Button type="submit" className="bg-[#FF8C42] hover:bg-[#e67a30]"
                      disabled={(!newMessage.trim() && !imagePreview) || sending} data-testid="send-message-submit">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--theme-text-muted)' }}>
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <h3 className="font-medium mb-1" style={{ color: 'var(--theme-text)' }}>Изберете разговор</h3>
                  <p className="text-sm mb-4">или започнете нов с бутона "Нов разговор"</p>
                  <Button onClick={() => setShowNewChat(true)} variant="outline" className="border-[#FF8C42] text-[#FF8C42]" data-testid="start-new-chat-btn">
                    <Plus className="h-4 w-4 mr-2" /> Нов разговор
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
