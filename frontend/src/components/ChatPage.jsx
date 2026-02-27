import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/App';
import { useLanguage } from '@/i18n/LanguageContext';
import { MessageSquare, Send, ArrowLeft, User, Clock, Image, X } from 'lucide-react';
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
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const imageInputRef = useRef(null);

  const toUserId = searchParams.get('to');
  const projectId = searchParams.get('project');

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }
    fetchConversations();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, token]);

  useEffect(() => {
    if (toUserId && token) {
      startConversation(toUserId, projectId);
    }
  }, [toUserId, projectId, token]);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data.conversations);
    } catch (err) {}
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
    } catch (err) {
      toast.error('Потребителят не е намерен');
    }
  };

  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const res = await axios.get(`${API}/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
      if (res.data.messages.length > 0 && !otherUser) {
        const msg = res.data.messages[0];
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        try {
          const userRes = await axios.get(`${API}/user/${otherId}/basic`);
          setOtherUser(userRes.data);
        } catch {}
      }
    } catch (err) {
      setMessages([]);
    }
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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файлът е прекалено голям (макс. 5MB)');
      return;
    }
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
        receiver_id: receiverId,
        content: newMessage,
        image: imagePreview || null,
        project_id: projectId || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      setImagePreview(null);
      
      if (!activeConversation) {
        setActiveConversation(res.data.conversation_id);
      }
      fetchConversations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при изпращане');
    }
    setSending(false);
  };

  const openConversation = (conv) => {
    setActiveConversation(conv.conversation_id);
    setOtherUser(conv.other_user);
    fetchMessages(conv.conversation_id);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="chat-page">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-orange-600" />
          Съобщения
        </h1>

        <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations sidebar */}
          <Card className="md:col-span-1 overflow-hidden flex flex-col">
            <CardHeader className="py-3 px-4 border-b bg-white">
              <CardTitle className="text-base">Разговори</CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-500">Зареждане...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">Нямате съобщения</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.conversation_id}
                    onClick={() => openConversation(conv)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      activeConversation === conv.conversation_id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                    }`}
                    data-testid={`conversation-${conv.conversation_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-orange-100 text-orange-700">
                          {conv.other_user.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{conv.other_user.name}</span>
                          {conv.unread_count > 0 && (
                            <Badge className="bg-orange-600 text-white text-xs ml-2">{conv.unread_count}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">
                          {conv.other_user.user_type === 'client' ? 'Клиент' : 'Фирма'}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Chat area */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden">
            {activeConversation || toUserId ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b bg-white flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => { setActiveConversation(null); setOtherUser(null); }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      {otherUser?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">{otherUser?.name || 'Зареждане...'}</h3>
                    <span className="text-xs text-slate-500">
                      {otherUser?.user_type === 'client' ? 'Клиент' : 'Фирма'}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">Започнете разговора</p>
                    </div>
                  )}
                  
                  {messages.map(msg => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isMine 
                            ? 'bg-orange-600 text-white rounded-br-md' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                        }`}>
                          {msg.image && (
                            <img 
                              src={msg.image} 
                              alt="Снимка" 
                              className="max-w-full rounded-lg mb-2 max-h-64 object-contain cursor-pointer"
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                          )}
                          {msg.content && (
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          )}
                          <p className={`text-[10px] mt-1 ${isMine ? 'text-orange-200' : 'text-slate-400'}`}>
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
                  <div className="px-3 pt-2 bg-white border-t">
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Преглед" className="h-20 rounded-lg object-cover" />
                      <button
                        onClick={() => setImagePreview(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message input */}
                <div className="p-3 border-t bg-white">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-orange-600 transition-colors"
                      data-testid="chat-image-btn"
                    >
                      <Image className="h-5 w-5" />
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Напишете съобщение..."
                      className="flex-1"
                      maxLength={2000}
                      data-testid="message-input"
                    />
                    <Button 
                      type="submit" 
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={(!newMessage.trim() && !imagePreview) || sending}
                      data-testid="send-message-submit"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="font-medium mb-1">Изберете разговор</h3>
                  <p className="text-sm">или започнете нов от страницата на проект</p>
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
