
import { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatGroup, User } from '../types';
import { storageService } from '../services/storageService';

export const useChatLoop = (activeSheet: string, currentUser: User | null, isMuted: boolean, googleToken?: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  
  const lastKnownCount = useRef<Record<string, number>>({});

  const fetchActive = async () => {
    if (!activeSheet) return;
    try {
      let data: ChatMessage[] = [];
      if (activeSheet.startsWith('spaces/') && googleToken) {
        data = await storageService.getGoogleChatMessages(googleToken, activeSheet);
      } else if (!activeSheet.startsWith('spaces/')) {
        data = await storageService.getChatMessages(activeSheet);
      }
      setMessages(data);
      lastKnownCount.current[activeSheet] = data.length;
      setUnreadMap(prev => ({ ...prev, [activeSheet]: 0 }));
    } catch (e) {
      console.error("Erro no chat loop:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
    const intervalTime = activeSheet.startsWith('spaces/') ? 6000 : 3000; // Poupar taxa de requisições no Google Chat
    const timer = setInterval(fetchActive, intervalTime);
    return () => clearInterval(timer);
  }, [activeSheet, googleToken]);

  return { 
    messages, 
    loading, 
    unreadMap, 
    previews, 
    refreshActive: fetchActive,
    markAsRead: (sheet: string, count: number) => {
      lastKnownCount.current[sheet] = count;
      setUnreadMap(prev => ({ ...prev, [sheet]: 0 }));
    }
  };
};
