import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader, Minus } from 'lucide-react';
import { createConversation, sendMessage, getConversation, joinConversation, unsubscribeFromMessages, type Conversation, type Message } from '../../../lib/chatService';
import './ChatWidget.css';

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [started, setStarted] = useState(false);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('opencode-chat', handler);
    return () => window.removeEventListener('opencode-chat', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!conv) {
      const saved = sessionStorage.getItem('chat_conv_id');
      if (saved) {
        getConversation(saved).then(c => {
          if (c && c.status === 'open') {
            setConv(c);
            setMessages(c.messages ?? []);
            setStarted(true);
            joinConversation(c.id, (msg) => {
              setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
            });
          } else {
            sessionStorage.removeItem('chat_conv_id');
          }
        }).catch(() => {});
      }
    }
  }, [open, conv]);

  useEffect(() => {
    return () => { unsubscribeFromMessages(); };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = async () => {
    const displayName = name.trim() || 'Guest';
    try {
      const c = await createConversation(displayName, email.trim() || undefined);
      setConv(c);
      setMessages(c.messages ?? []);
      setStarted(true);
      sessionStorage.setItem('chat_conv_id', c.id);
      joinConversation(c.id, (msg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
    } catch (e: any) {
      console.error('Failed to start chat:', e);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !conv || sending) return;
    setSending(true);
    const displayName = name.trim() || 'Guest';
    try {
      await sendMessage(conv.id, displayName, text);
      setInput('');
    } catch (e: any) {
      console.error('Failed to send:', e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const bubble = (
    <motion.button
      className="chat-bubble"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setOpen(true)}
    >
      <MessageCircle size={24} />
    </motion.button>
  );

  if (!open) return bubble;

  return (
    <>
      {bubble}
      <AnimatePresence>
        {open && (
          <motion.div
            className="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <MessageCircle size={18} />
                <span>Live Chat</span>
              </div>
              <button className="chat-header-close" onClick={handleClose}>
                <Minus size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="chat-body" ref={listRef}>
              {!started ? (
                <div className="chat-start">
                  <p className="chat-start-title">Start a Conversation</p>
                  <p className="chat-start-desc">Leave your details and start chatting with our support team.</p>
                  <input
                    className="chat-input chat-start-input"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  <input
                    className="chat-input chat-start-input"
                    placeholder="Your email (optional)"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <button className="chat-start-btn" onClick={handleStart}>
                    Start Chat
                  </button>
                </div>
              ) : (
                <div className="chat-messages">
                  {messages.length === 0 && (
                    <div className="chat-empty">Chat started. Say hello!</div>
                  )}
                  {messages.map((msg, idx) => {
                    const isMine = msg.sender_type !== 'admin';
                    const showName = idx === 0 || messages[idx - 1].sender_type !== msg.sender_type;
                    return (
                      <div key={msg.id} style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}>
                        {showName && (
                          <span style={{
                            fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
                            color: 'var(--text-muted)', marginBottom: '0.1rem',
                            marginLeft: isMine ? 0 : '0.35rem',
                            marginRight: isMine ? '0.35rem' : 0,
                          }}>
                            {isMine ? 'You' : 'Support'}
                          </span>
                        )}
                        <div style={{
                          padding: '0.4rem 0.65rem',
                          borderRadius: isMine ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
                          background: isMine ? 'rgba(253,184,19,0.15)' : 'rgba(255,255,255,0.06)',
                          border: isMine ? '1px solid rgba(253,184,19,0.1)' : '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <div style={{ fontSize: '0.8rem', color: 'white', lineHeight: '1.4', wordBreak: 'break-word' }}>
                            {msg.content}
                          </div>
                          <div style={{
                            fontSize: '0.5rem', color: 'var(--text-muted)',
                            textAlign: 'right', marginTop: '0.1rem',
                          }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Input */}
            {started && (
              <div className="chat-footer">
                <input
                  className="chat-input chat-footer-input"
                  placeholder="Type your message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                />
                <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || sending}>
                  {sending ? <Loader size={16} className="spin" /> : <Send size={16} />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
