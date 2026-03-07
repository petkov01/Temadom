import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/App';
import { MessageSquare, Send, ArrowLeft, User, Search, Image, X, Plus, Building2, Wrench, Users, Check, CheckCheck, Circle } from 'lucide-react';
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
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const typingRef = useRef(null);
  const heartbeatRef = useRef(null);
  const imageInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const toUserId = searchParams.get('to');
  const projectId = searchParams.get('project');

  useEffect(() => {
    if (!user || !token) { navigate('/login'); return; }
    fetchConversations();
    
    // Online heartbeat every 30s
    const sendHeartbeat = () => {
      axios.post(`${API}/chat/online`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    };
    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 30000);
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [user, token]);

  useEffect(() => {
    if (toUserId && token) {
      startConversation(toUserId, projectId);
      setMobileShowChat(true);
    }
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
      checkOnlineStatus(otherId);
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

  const checkOnlineStatus = async (userId) => {
    try {
      const res = await axios.get(`${API}/chat/online/${userId}`);
      setOtherOnline(res.data.online);
    } catch { setOtherOnline(false); }
  };

  const checkTypingStatus = async (convId) => {
    try {
      const res = await axios.get(`${API}/chat/typing/${convId}`, { headers: { Authorization: `Bearer ${token}` } });
      setOtherTyping(res.data.is_typing);
    } catch { setOtherTyping(false); }
  };

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeConversation) {
      pollRef.current = setInterval(() => {
        fetchMessages(activeConversation);
        checkTypingStatus(activeConversation);
        if (otherUser?.id) checkOnlineStatus(otherUser.id);
      }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConversation, fetchMessages, otherUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Heartbeat to track online status
  useEffect(() => {
    if (!token) return;
    const sendHeartbeat = () => axios.post(`${API}/chat/online`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    sendHeartbeat();
    const hb = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(hb);
  }, [token]);

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

  const handleTyping = () => {
    if (!activeConversation || !token) return;
    if (typingRef.current) clearTimeout(typingRef.current);
    axios.post(`${API}/chat/typing`, { conversation_id: activeConversation, is_typing: true }, 
      { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    typingRef.current = setTimeout(() => {
      axios.post(`${API}/chat/typing`, { conversation_id: activeConversation, is_typing: false },
        { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }, 3000);
  };

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
    // Stop typing indicator
    if (typingRef.current) clearTimeout(typingRef.current);
    axios.post(`${API}/chat/typing`, { conversation_id: activeConversation, is_typing: false },
      { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
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
    setOtherOnline(false);
    fetchMessages(conv.conversation_id);
    checkOnlineStatus(conv.other_user.id);
    setShowNewChat(false);
    setMobileShowChat(true);
  };

  const startChatWithUser = (u) => {
    setOtherUser(u);
    const sortedIds = [user.id, u.id].sort();
    const convId = `${sortedIds[0]}_${sortedIds[1]}`;
    setActiveConversation(convId);
    fetchMessages(convId);
    checkOnlineStatus(u.id);
    setShowNewChat(false);
    setUserSearch('');
    setSearchResults([]);
    setMobileShowChat(true);
  };

  const goBackToList = () => {
    setMobileShowChat(false);
    setActiveConversation(null);
    setOtherUser(null);
    fetchConversations();
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

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'сега';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`;
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{background: "var(--theme-bg-secondary)"}} data-testid="chat-page">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--theme-text)' }}>
            <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-[#FF8C42]" />
            Съобщения
          </h1>
          <Button onClick={() => setShowNewChat(!showNewChat)} className="bg-[#FF8C42] hover:bg-[#e67a30] text-sm" size="sm" data-testid="new-chat-btn">
            <Plus className="h-4 w-4 mr-1" /> Нов
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6" style={{ height: 'calc(100vh - 160px)' }}>
          {/* Conversations sidebar - hidden on mobile when chat is open */}
          <Card className={`md:col-span-1 overflow-hidden flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}
            style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
            <CardHeader className="py-3 px-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <CardTitle className="text-sm" style={{ color: 'var(--theme-text)' }}>Разговори ({conversations.length})</CardTitle>
            </CardHeader>

            {/* New chat search */}
            {showNewChat && (
              <div className="p-3 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--theme-text-muted)' }} />
                  <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Търси по име..." className="pl-9 text-sm" data-testid="user-search-input" autoFocus />
                </div>
                {searching && <p className="text-xs mt-2" style={{ color: 'var(--theme-text-muted)' }}>Търсене...</p>}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                    {searchResults.map(u => (
                      <button key={u.id} onClick={() => startChatWithUser(u)}
                        className="w-full text-left p-2 rounded-lg hover:bg-[#FF8C42]/10 transition-colors flex items-center gap-2"
                        data-testid={`search-result-${u.id}`}>
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-[#FF8C42]/10 text-[#FF8C42] text-xs">{u.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--theme-text)' }}>{u.name}</p>
                          <div className="flex items-center gap-1">
                            {getUserTypeIcon(u.user_type)}
                            <span className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>
                              {getUserTypeLabel(u.user_type)}{u.city && ` · ${u.city}`}
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
                  <p className="text-xs mt-1">Натиснете "Нов" за да започнете</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button key={conv.conversation_id} onClick={() => openConversation(conv)}
                    className="w-full text-left p-3 border-b transition-colors hover:opacity-80"
                    style={{
                      borderColor: 'var(--theme-border)',
                      background: activeConversation === conv.conversation_id ? 'rgba(249,115,22,0.08)' : 'transparent',
                      borderLeft: activeConversation === conv.conversation_id ? '3px solid #F97316' : '3px solid transparent',
                    }}
                    data-testid={`conversation-${conv.conversation_id}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-[#FF8C42]/10 text-[#FF8C42] text-sm">{conv.other_user.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        {conv.other_user.is_online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2" style={{ borderColor: 'var(--theme-card-bg)' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium text-sm truncate" style={{ color: 'var(--theme-text)' }}>{conv.other_user.name}</span>
                          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--theme-text-subtle)' }}>{formatTime(conv.last_message_at)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs truncate" style={{ color: conv.unread_count > 0 ? 'var(--theme-text)' : 'var(--theme-text-muted)', fontWeight: conv.unread_count > 0 ? 600 : 400 }}>
                            {conv.last_message || 'Снимка'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="bg-[#F97316] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Chat area - full width on mobile when active */}
          <Card className={`md:col-span-2 flex flex-col overflow-hidden ${!mobileShowChat && !activeConversation ? 'hidden md:flex' : 'flex'}`}
            style={{ background: 'var(--theme-card-bg)', borderColor: 'var(--theme-border)' }}>
            {activeConversation || toUserId ? (
              <>
                {/* Chat header with online status */}
                <div className="p-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--theme-border)' }}>
                  <Button variant="ghost" size="sm" className="md:hidden p-1" onClick={goBackToList} data-testid="chat-back-btn">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-[#FF8C42]/10 text-[#FF8C42]">{otherUser?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    {otherOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2" style={{ borderColor: 'var(--theme-card-bg)' }} data-testid="online-indicator" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate" style={{ color: 'var(--theme-text)' }}>{otherUser?.name || 'Зареждане...'}</h3>
                    <span className="text-[11px] flex items-center gap-1" style={{ color: otherOnline ? '#10B981' : 'var(--theme-text-muted)' }}>
                      {otherOnline ? (
                        <>
                          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                          {otherTyping ? 'пише...' : 'онлайн'}
                        </>
                      ) : (
                        <>
                          {getUserTypeIcon(otherUser?.user_type)}
                          {getUserTypeLabel(otherUser?.user_type)}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2" style={{ background: 'var(--theme-bg)' }}>
                  {messages.length === 0 && (
                    <div className="text-center py-12" style={{ color: 'var(--theme-text-muted)' }}>
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Започнете разговора</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user.id;
                    const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1]?.created_at).toDateString();
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="text-center my-3">
                            <span className="text-[10px] px-3 py-1 rounded-full" style={{ background: 'var(--theme-bg-surface)', color: 'var(--theme-text-muted)' }}>
                              {new Date(msg.created_at).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-3.5 py-2 ${
                            isMine ? 'bg-[#F97316] text-white rounded-br-sm' : 'rounded-bl-sm'
                          }`} style={!isMine ? { background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)' } : {}}>
                            {msg.image && (
                              <img src={msg.image} alt="Снимка" className="max-w-full rounded-lg mb-1.5 max-h-56 object-contain cursor-pointer"
                                onClick={() => window.open(msg.image, '_blank')} />
                            )}
                            {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}
                            <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? 'text-orange-200' : ''}`}>
                              <span className="text-[10px]" style={!isMine ? { color: 'var(--theme-text-subtle)' } : {}}>
                                {new Date(msg.created_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && (
                                msg.read ? (
                                  <CheckCheck className="h-3 w-3 text-blue-300" data-testid="msg-read" />
                                ) : (
                                  <Check className="h-3 w-3 text-orange-200" data-testid="msg-sent" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  {/* Typing indicator */}
                  {otherTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-sm px-4 py-2.5" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
                        <div className="flex gap-1 items-center">
                          <span className="w-2 h-2 bg-[#FF8C42] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-[#FF8C42] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-[#FF8C42] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Image preview */}
                {imagePreview && (
                  <div className="px-3 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Преглед" className="h-16 rounded-lg object-cover" />
                      <button onClick={() => setImagePreview(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message input */}
                <div className="p-2.5 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <button type="button" onClick={() => imageInputRef.current?.click()}
                      className="p-2 transition-colors hover:text-[#FF8C42] flex-shrink-0" style={{ color: 'var(--theme-text-muted)' }} data-testid="chat-image-btn">
                      <Image className="h-5 w-5" />
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <Input value={newMessage} 
                      onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                      placeholder="Напишете..." className="flex-1 text-sm" maxLength={2000} data-testid="message-input" />
                    <Button type="submit" className="bg-[#FF8C42] hover:bg-[#e67a30] flex-shrink-0" size="sm"
                      disabled={(!newMessage.trim() && !imagePreview) || sending} data-testid="send-message-submit">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--theme-text-muted)' }}>
                <div className="text-center px-4">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <h3 className="font-medium mb-1 text-sm" style={{ color: 'var(--theme-text)' }}>Изберете разговор</h3>
                  <p className="text-xs mb-4">или започнете нов с бутона "Нов"</p>
                  <Button onClick={() => setShowNewChat(true)} variant="outline" size="sm" className="border-[#FF8C42] text-[#FF8C42]" data-testid="start-new-chat-btn">
                    <Plus className="h-4 w-4 mr-1" /> Нов разговор
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
