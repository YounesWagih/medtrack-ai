import apiService from '@/services/api';
import type { ChatSession, ChatMessage, SendMessageDto } from '@/types/api';

export const chatService = {
  // Create a new chat session
  async createSession(): Promise<ChatSession> {
    return apiService.post('/chat/sessions');
  },

  // Get all sessions for current user (optional endpoint, if backend supports)
  async listSessions(): Promise<ChatSession[]> {
    return apiService.get('/chat/sessions');
  },

  // Get messages for a session
  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return apiService.get(`/chat/sessions/${sessionId}/messages`);
  },

  // Send a message to a session
  async sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
    return apiService.post(`/chat/sessions/${sessionId}/messages`, { content } as SendMessageDto);
  },

  // Stream a message (if backend supports streaming)
  // This would use fetch directly for streaming
  async *streamMessage(sessionId: string, content: string): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        // Assume server sends JSON lines or SSE format
        yield text;
      }
    } finally {
      reader.releaseLock();
    }
  },
};
