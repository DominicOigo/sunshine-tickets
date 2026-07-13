import { request } from './api';
import { subscribeToMessages } from './supabase';

export interface Conversation {
  id:            string;
  user_id:       string | null;
  user_name:     string;
  user_email:    string | null;
  status:        string;
  created_at:    string;
  updated_at:    string;
  messages?:     Message[];
  message_count?: number;
  last_message?:  string;
}

export interface Message {
  id:               string;
  conversation_id:  string;
  sender_type:      'user' | 'admin';
  sender_name:      string;
  content:          string;
  created_at:       string;
}

let realtimeChannel: any = null;

export function joinConversation(conversationId: string, onMessage: (msg: Message) => void) {
  unsubscribeFromMessages();
  realtimeChannel = subscribeToMessages(conversationId, onMessage);
}

export function unsubscribeFromMessages() {
  if (realtimeChannel) {
    realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
}

export async function createConversation(user_name?: string, user_email?: string): Promise<Conversation> {
  return request('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ user_name, user_email }),
  });
}

export async function getConversation(id: string): Promise<Conversation> {
  return request(`/chat/conversations/${id}`);
}

export async function sendMessage(conversationId: string, sender_name: string, content: string): Promise<Message> {
  return request(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ sender_name, content }),
  });
}

export async function getAdminConversations(): Promise<Conversation[]> {
  return request('/chat/admin/conversations');
}

export async function getAdminConversation(id: string): Promise<Conversation> {
  return request(`/chat/admin/conversations/${id}`);
}

export async function adminSendMessage(conversationId: string, content: string): Promise<Message> {
  return request(`/chat/admin/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function closeConversation(id: string): Promise<Conversation> {
  return request(`/chat/admin/conversations/${id}/close`, {
    method: 'PATCH',
  });
}
