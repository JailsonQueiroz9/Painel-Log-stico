
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, RotateCw, Loader2, Image as ImageIcon, Search, Plus, 
  Hash, AtSign, Edit3, X, MessageSquare, Zap, Check, ChevronDown,
  Smile, Type, Sticker, Bold, Italic, Strikethrough, Code, Clock,
  Car, Apple, Dog, Trophy, Umbrella, Lightbulb, Heart, Flag,
  PanelLeftClose, PanelLeftOpen, Shield, Key
} from 'lucide-react';
import { ChatMessage, User, ChatGroup, GroupCreatePayload } from '../types';
import { storageService } from '../services/storageService';
import { useChatLoop } from '../hooks/useChatLoop';
import SidebarChat from './SidebarChat';
import CreateGroupModal from './CreateGroupModal';
import GroupInfoModal from './GroupInfoModal';

// Categorias de Emojis Estilo WhatsApp
const EMOJI_CATEGORIES = [
  { id: 'smileys', label: '😃', icon: <Smile size={16} />, emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'] },
  { id: 'animals', label: '🐶', icon: <Dog size={16} />, emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🦍', '🦧', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦝', '🐈', '🐈‍⬛', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🦬', '🐂', '🐃', '🐄', '🐖', '🐗', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦣', '🦏', '🦛', '🐁', '🐀', '🐿️', '🦫', '🦔', '🦇', '🐻‍❄️', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾'] },
  { id: 'food', label: '🍎', icon: <Apple size={16} />, emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '發', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', 'バター', '🥞', ' waffle', ' bacon', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥣', '🍝', '🍜', '🍲', ' curry', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', ' popcorn', '🍩', '🍪', '🌰', '🥜', '🍯'] },
  { id: 'activities', label: '⚽', icon: <Trophy size={16} />, emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', ' hockey', ' field hockey', '🥍', ' cricket', ' boomerang', ' goal', '⛳', ' kite', ' bow and arrow', ' fishing', ' diver', ' boxing', ' martial arts', ' running shirt', ' skateboard', ' roller skate', ' sled', ' ice skate', ' ski', ' skier', ' snowboarder', ' parachute', ' weight lifter', ' wrestler', ' gymnast', ' basketball player', ' fencer', ' handball player', ' golfer', ' horse racing', ' yoga', ' surfer', ' swimmer', ' water polo', ' rower', ' climber', ' cyclist', ' mountain biker', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', ' rosette', ' ticket', '🎟️', ' performing arts', '🎨', ' movie', ' mic', ' headphones', ' musical score', ' piano', ' drum', '🪘', ' saxophone', ' trumpet', ' guitar', ' banjo', ' violin', ' game die', ' chess pawn', '🎯', ' bowling', ' video game', ' slot machine', ' puzzle'] },
  { id: 'travel', label: '🚗', icon: <Car size={16} />, emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🛺', '🚲', '🛴', ' skateboard', ' roller skate', ' bus stop', ' motorway', ' railway track', ' oil drum', ' fuel pump', '🚨', '🚥', '🚦', '🛑', '🚧', ' anchor', ' sailboat', ' canoe', ' speedboat', ' passenger ship', ' ferry', ' ship', ' airplane', '🛫', '🛬', ' parachute', '💺', ' helicopter', ' suspension railway', ' mountain cableway', ' aerial tramway', ' rocket', ' flying saucer', ' satellite'] },
  { id: 'objects', label: '💡', icon: <Lightbulb size={16} />, emojis: ['⌚', '📱', '📲', '💻', ' keyboard', ' mouse', ' trackball', ' joystick', ' clamp', ' computer disk', ' floppy disk', ' optical disk', ' dvd', ' vhs', ' camera', '📸', ' video camera', ' movie camera', ' projector', ' film frames', ' telephone', '☎️', ' pager', ' fax machine', '📺', ' radio', ' studio microphone', ' level slider', ' control knobs', ' compass', ' stopwatch', ' timer clock', ' alarm clock', ' mantelpiece clock', ' hourglass done', ' hourglass not done', ' satellite antenna', ' battery', ' electric plug', '💡', ' flashlight', ' candle', ' diyah lamp', ' fire extinguisher', ' oil drum', ' money bag', ' dollar banknote', ' yen banknote', ' euro banknote', ' pound banknote', ' coin', ' money bag', ' credit card', ' gem stone', ' balance scale', ' ladder', ' toolbox', ' screwdriver', ' wrench', ' hammer', ' hammer and pick', ' tools', ' pick', ' carpentry saw', ' pistol', ' bomb', ' boomerang', ' kitchen knife', ' dagger', ' crossed swords', ' shield', ' cigarette', ' coffin', ' funeral urn', ' amphora', ' crystal ball', ' prayer beads', ' nazar amulet', ' barber pole', ' alembic', ' telescope', ' microscope', ' hole', ' stethoscope', ' x-ray', ' test tube', ' petri dish', ' dna', ' pill', ' syringe', ' drop of blood', ' label', ' bookmark'] },
  // Fix: Changed non-existent 'Symbols' to 'Heart' icon
  { id: 'symbols', label: '🔣', icon: <Heart size={16} />, emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤'] }
];

// Figurinhas Operacionais (Stickers)
const LOGISTIC_STICKERS = [
  { id: 'delivered', url: 'https://cdn-icons-png.flaticon.com/512/1161/1161388.png', label: 'ENTREGUE' },
  { id: 'delay', url: 'https://cdn-icons-png.flaticon.com/512/2814/2814368.png', label: 'ATRASO' },
  { id: 'transit', url: 'https://cdn-icons-png.flaticon.com/512/713/713311.png', label: 'TRÂNSITO' },
  { id: 'boarding', url: 'https://cdn-icons-png.flaticon.com/512/784/784841.png', label: 'EMBARQUE' },
  { id: 'import', url: 'https://cdn-icons-png.flaticon.com/512/2891/2891415.png', label: 'IMPORT' },
  { id: 'ok', url: 'https://cdn-icons-png.flaticon.com/512/1632/1632670.png', label: 'CARGA OK' }
];

const Chat: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<ChatGroup>({ 
    name: 'GRUPO PCP', 
    sheetName: 'CHAT', 
    type: 'group',
    unreadCount: 0,
    lastReadCount: 0,
    members: []
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);

  const [inputText, setInputText] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [isMuted] = useState(true);
  const [sending, setSending] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lastReadCount, setLastReadCount] = useState<number>(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessagesBubble, setShowNewMessagesBubble] = useState(false);
  
  // Google Chat States
  const [googleClientId, setGoogleClientId] = useState<string>(
    localStorage.getItem('google_chat_client_id') || "1041920786961-oihb1vsc80qge2or948q43v5g6unb7ve.apps.googleusercontent.com"
  );
  const [googleToken, setGoogleToken] = useState<string | null>(localStorage.getItem('google_chat_token'));
  const [googleSpaces, setGoogleSpaces] = useState<any[]>([]);
  const [loadingGoogleSpaces, setLoadingGoogleSpaces] = useState(false);
  const [showGoogleTokenModal, setShowGoogleTokenModal] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');

  // States para Popovers
  const [activePopover, setActivePopover] = useState<'emoji' | 'sticker' | 'format' | null>(null);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { messages, loading, unreadMap, previews, refreshActive, markAsRead } = useChatLoop(activeSession.sheetName, currentUser, isMuted, googleToken);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Monitor URL window locations for implicit token hash
  useEffect(() => {
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        setGoogleToken(accessToken);
        localStorage.setItem('google_chat_token', accessToken);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Fetch spaces list automatically when token is set
  useEffect(() => {
    if (googleToken) {
      setLoadingGoogleSpaces(true);
      storageService.getGoogleChatSpaces(googleToken)
        .then(spaces => {
          setGoogleSpaces(spaces);
          setLoadingGoogleSpaces(false);
        })
        .catch(err => {
          console.error("Erro ao sincronizar canais Google Chat:", err);
          setLoadingGoogleSpaces(false);
          // Token expirado/inválido
          setGoogleToken(null);
          localStorage.removeItem('google_chat_token');
        });
    } else {
      setGoogleSpaces([]);
    }
  }, [googleToken]);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar usuário:", e);
      }
    }
    
    storageService.getUsers().then(setUsers);
    storageService.getGroups().then(dynamicGroups => {
      const baseGroups: ChatGroup[] = [
        { name: 'GRUPO PCP', sheetName: 'CHAT', type: 'group', unreadCount: 0, lastReadCount: 0, members: [] },
        { name: 'LOGÍSTICA INTERNA', sheetName: 'LOG_INT', type: 'group', unreadCount: 0, lastReadCount: 0, members: [] }
      ];
      
      const mapped = dynamicGroups.map(g => ({
        name: g.name,
        sheetName: g.sheetName,
        type: 'group' as const,
        unreadCount: 0,
        lastReadCount: 0,
        members: g.members || []
      }));
      
      const final = [...baseGroups];
      mapped.forEach(mg => {
        if (!final.find(f => f.sheetName === mg.sheetName)) final.push(mg);
      });
      
      setGroups(final);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      if (isAtBottom) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        markAsRead(activeSession.sheetName, messages.length);
        setLastReadCount(messages.length);
        setShowNewMessagesBubble(false);
      } else if (messages.length > lastReadCount) {
        setShowNewMessagesBubble(true);
      }
    }
  }, [messages, activeSession.sheetName, isAtBottom]);

  useEffect(() => {
    const saved = localStorage.getItem(`chat_last_read_${activeSession.sheetName}`);
    const count = saved ? parseInt(saved) : messages.length;
    setLastReadCount(count);
    
    // Reset scroll and bubble when changing session
    setIsAtBottom(true);
    setShowNewMessagesBubble(false);
  }, [activeSession.sheetName]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
      
      if (atBottom) {
        setShowNewMessagesBubble(false);
        markAsRead(activeSession.sheetName, messages.length);
        setLastReadCount(messages.length);
        localStorage.setItem(`chat_last_read_${activeSession.sheetName}`, messages.length.toString());
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      setIsAtBottom(true);
      setShowNewMessagesBubble(false);
    }
  };

  const handleSelectSession = (session: ChatGroup) => {
    if (session.type === 'group' && currentUser?.id) {
      const isBaseGroup = session.sheetName === 'CHAT' || session.sheetName === 'LOG_INT';
      const hasPermission = isBaseGroup || (session.members && session.members.includes(currentUser.id));
      
      if (!hasPermission) {
        alert("Acesso Negado: Você não é membro deste canal operacional.");
        return;
      }
    }
    setActiveSession(session);
  };

  const handleSend = async (customPayload?: Partial<ChatMessage>) => {
    if (!currentUser || sending) return;
    
    const textValue = customPayload?.text !== undefined ? customPayload.text : inputText.trim();
    const imageToUpload = customPayload?.img || previewImage;

    if (!textValue && !imageToUpload) return;

    setSending(true);
    try {
      if (activeSession.type === 'google-chat') {
        if (!googleToken) {
          alert("Por favor, conecte a sua conta do Google Chat primeiro.");
          setSending(false);
          return;
        }
        await storageService.sendGoogleChatMessage(googleToken, activeSession.sheetName, textValue);
        setInputText('');
        setPreviewImage(null);
        setSelectedFile(null);
        await refreshActive();
        setSending(false);
        return;
      }

      let finalImageUrl = customPayload?.img || "";

      if (selectedFile) {
        finalImageUrl = await storageService.uploadFile(selectedFile);
      } else if (previewImage && !customPayload?.img) {
        finalImageUrl = previewImage;
      }

      const userName = currentUser.name || currentUser.USUÁRIO || "Operador";

      const data: Partial<ChatMessage> = {
        user: userName,
        text: textValue,
        img: finalImageUrl,
        type: finalImageUrl ? 'image' : 'text',
        timestamp: new Date().toISOString()
      };

      await storageService.saveChatMessage(activeSession.sheetName, data);
      
      if (!customPayload) {
        setInputText('');
        setPreviewImage(null);
        setSelectedFile(null);
      }
      setActivePopover(null);
      await refreshActive();
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      alert("Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const applyFormatting = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = inputText;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;
    setInputText(newText);
    
    // Devolver o foco e selecionar o texto formatado
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + prefix.length, end + prefix.length);
      }
    }, 10);
  };

  const insertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setInputText(prev => prev + emoji);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const before = inputText.substring(0, start);
    const after = inputText.substring(end);
    setInputText(before + emoji + after);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
      }
    }, 10);
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConnectGoogle = () => {
    setShowGoogleTokenModal(true);
  };

  const handleDisconnectGoogle = () => {
    setGoogleToken(null);
    localStorage.removeItem('google_chat_token');
    if (activeSession.type === 'google-chat') {
      setActiveSession({ 
        name: 'GRUPO PCP', 
        sheetName: 'CHAT', 
        type: 'group',
        unreadCount: 0,
        lastReadCount: 0,
        members: []
      });
    }
  };

  const filteredMessages = useMemo(() => {
    if (!msgSearch) return messages;
    return messages.filter(m => 
      m.text.toLowerCase().includes(msgSearch.toLowerCase()) || 
      m.user.toLowerCase().includes(msgSearch.toLowerCase())
    );
  }, [messages, msgSearch]);

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-custom-main">
      <SidebarChat 
        currentUser={currentUser}
        users={users}
        groups={groups}
        activeSession={activeSession}
        onSelect={(s) => { handleSelectSession(s); setActivePopover(null); }}
        unreadMap={unreadMap}
        previews={previews}
        onAddGroup={() => setIsCreateGroupModalOpen(true)}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        googleToken={googleToken}
        googleSpaces={googleSpaces}
        loadingGoogleSpaces={loadingGoogleSpaces}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
      />

      <div className="flex-1 flex flex-col min-w-0 border-l border-slate-200 dark:border-white/5 relative">
        <header className="px-8 py-6 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/90 backdrop-blur-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-primary-500 hover:border-primary-500/30 rounded-xl transition-all active:scale-95"
                title="Mostrar Sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all cursor-pointer hover:scale-105 ${activeSession.type === 'group' ? 'bg-primary-600/10 border-primary-500/20 text-primary-500 hover:bg-primary-600/20' : activeSession.type === 'google-chat' ? 'bg-blue-600/10 border-blue-500/20 text-blue-500' : 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-600/20'}`}
                 onClick={() => {
                   if (activeSession.type === 'group') {
                     setIsGroupInfoModalOpen(true);
                   }
                 }}
                 title={activeSession.type === 'group' ? "Ver informações do grupo" : ""}
            >
              {activeSession.type === 'group' ? <Hash size={20} /> : activeSession.type === 'google-chat' ? <MessageSquare size={20} /> : <AtSign size={20} />}
            </div>
            <div 
              className="cursor-pointer group"
              onClick={() => {
                if (activeSession.type === 'group') {
                   setIsGroupInfoModalOpen(true);
                }
              }}
            >
              <h2 className="text-xl font-black text-custom-main italic tracking-tighter uppercase leading-none group-hover:text-primary-500 transition-colors">{activeSession.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeSession.type === 'google-chat' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.3em] italic group-hover:text-primary-400 transition-colors">
                  {activeSession.type === 'group' ? 'Ver Membros' : activeSession.type === 'google-chat' ? 'GOOGLE CHAT REAL' : 'Servidor Ativo'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input 
                type="text" 
                placeholder="BUSCAR NO FLUXO..."
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-[9px] font-black text-custom-main outline-none focus:border-primary-500 transition-all uppercase tracking-widest placeholder:text-slate-800 w-48"
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
              />
            </div>
            <button onClick={refreshActive} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:text-white rounded-xl transition-all active:scale-95">
              <RotateCw size={18} className={loading ? 'animate-spin text-primary-500' : ''} />
            </button>
          </div>
        </header>

        <div 
          ref={scrollRef} 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar relative"
        >
          {filteredMessages.map((msg, idx) => {
            const isMe = msg.user === (currentUser?.name || currentUser?.USUÁRIO);
            const displayTime = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
            
            const isNew = idx >= lastReadCount && lastReadCount > 0 && !isMe;

            return (
              <React.Fragment key={msg.id || idx}>
                {idx === lastReadCount && lastReadCount > 0 && lastReadCount < messages.length && (
                  <div className="flex items-center gap-4 py-4">
                    <div className="flex-1 h-px bg-primary-500/20" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary-500 bg-primary-500/10 px-4 py-1.5 rounded-full border border-primary-500/20">
                      Novas Mensagens
                    </span>
                    <div className="flex-1 h-px bg-primary-500/20" />
                  </div>
                )}
                <div className={`flex items-start gap-4 ${isMe ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[12px] font-black shrink-0 shadow-lg ${isMe ? 'bg-primary-600 text-white shadow-primary-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5'}`}>
                    {msg.user ? msg.user.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-3 mb-2 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{msg.user}</span>
                      <span className="text-[9px] text-slate-600 font-bold">{displayTime}</span>
                      {isNew && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      )}
                    </div>
                    
                    <div className={`px-5 py-4 rounded-[26px] text-sm shadow-2xl relative transition-all ${isMe ? 'bg-primary-600 text-white rounded-tr-none shadow-primary-900/40' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-tl-none'} ${isNew ? 'border-primary-500/30' : ''}`}>
                      {msg.img ? (
                        <div className="space-y-3">
                          <img 
                            src={msg.img} 
                            alt="Arquivo" 
                            className="rounded-2xl max-w-full h-auto cursor-zoom-in hover:brightness-110 transition-all border border-slate-200 dark:border-white/10 max-h-96 object-contain"
                            onClick={() => window.open(msg.img, '_blank')}
                          />
                          {msg.text && <p className="font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                      ) : (
                        <p className="font-semibold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {showNewMessagesBubble && (
          <button 
            onClick={scrollToBottom}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-6 py-3 rounded-full shadow-2xl shadow-primary-900/40 flex items-center gap-3 animate-bounce z-20 border border-primary-400/30 group active:scale-95 transition-all"
          >
            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
              <ChevronDown size={14} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Novas Mensagens</span>
            <span className="bg-white text-primary-600 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black">
              {messages.length - lastReadCount}
            </span>
          </button>
        )}

        <div className="p-8 bg-white dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-white/5 relative">
          
          {/* Popover de Formatação */}
          {activePopover === 'format' && (
            <div className="absolute left-32 bottom-[110%] mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-2 p-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50">
               <button onClick={() => applyFormatting('**')} className="p-3 hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-all"><Bold size={18} /></button>
               <button onClick={() => applyFormatting('_')} className="p-3 hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-all"><Italic size={18} /></button>
               <button onClick={() => applyFormatting('~~')} className="p-3 hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-all"><Strikethrough size={18} /></button>
               <button onClick={() => applyFormatting('`')} className="p-3 hover:bg-white/5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white transition-all"><Code size={18} /></button>
            </div>
          )}

          {/* Popover de Emojis */}
          {activePopover === 'emoji' && (
            <div className="absolute right-40 bottom-[110%] mb-4 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 z-50">
               <div className="flex border-b border-slate-200 dark:border-white/5 p-2 bg-slate-50 dark:bg-slate-950/50 overflow-x-auto no-scrollbar">
                  {EMOJI_CATEGORIES.map(cat => (
                    <button 
                      key={cat.id} 
                      onClick={() => setActiveEmojiCategory(cat.id)}
                      className={`p-3 rounded-xl transition-all ${activeEmojiCategory === cat.id ? 'bg-primary-600/20 text-primary-500' : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'}`}
                    >
                      {cat.icon}
                    </button>
                  ))}
               </div>
               <div className="p-4 grid grid-cols-6 gap-2 h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                  {EMOJI_CATEGORIES.find(c => c.id === activeEmojiCategory)?.emojis.map((emoji, i) => (
                    <button key={i} onClick={() => insertEmoji(emoji)} className="text-2xl hover:bg-white/5 p-1 rounded-lg transition-all active:scale-90">
                      {emoji}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {/* Popover de Stickers */}
          {activePopover === 'sticker' && (
            <div className="absolute right-24 bottom-[110%] mb-4 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[28px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 z-50">
               <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Sticker size={14} /> Figurinas Operacionais
               </div>
               <div className="p-4 grid grid-cols-3 gap-4 h-64 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                  {LOGISTIC_STICKERS.map(stk => (
                    <button 
                      key={stk.id} 
                      onClick={() => handleSend({ img: stk.url, text: '', type: 'image' })}
                      className="group flex flex-col items-center gap-2 hover:bg-white/5 p-3 rounded-2xl transition-all"
                    >
                      <img src={stk.url} alt={stk.label} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                      <span className="text-[7px] font-black text-slate-600 group-hover:text-primary-500">{stk.label}</span>
                    </button>
                  ))}
               </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto flex items-center gap-4 px-2">
            <button 
              onClick={() => fileRef.current?.click()} 
              className={`p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl transition-all shadow-lg shrink-0 ${previewImage ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400 hover:text-primary-500'}`}
              title="Anexar Imagem"
            >
              <ImageIcon size={22} />
            </button>
            <input type="file" ref={fileRef} onChange={onImageUpload} className="hidden" accept="image/*" />
            
            <div className="flex-1 relative flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[28px] pr-6 shadow-inner focus-within:border-primary-600/50 transition-all">
              <textarea 
                ref={textareaRef}
                rows={1}
                placeholder="REPASSAR INFORMAÇÃO OPERACIONAL..."
                className="flex-1 bg-transparent px-8 py-4 text-sm font-bold text-custom-main outline-none resize-none placeholder:text-slate-800 uppercase tracking-widest min-h-[56px] max-h-32 custom-scrollbar"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              
              <div className="flex items-center gap-4 shrink-0 text-slate-500">
                <button 
                  onClick={() => setActivePopover(activePopover === 'format' ? null : 'format')} 
                  className={`hover:text-primary-400 transition-colors p-1 ${activePopover === 'format' ? 'text-primary-500' : ''}`}
                >
                   <Type size={20} className="border-b-2 border-slate-700 pb-0.5" />
                </button>
                <button 
                  onClick={() => setActivePopover(activePopover === 'emoji' ? null : 'emoji')} 
                  className={`hover:text-amber-400 transition-colors p-1 ${activePopover === 'emoji' ? 'text-amber-500' : ''}`}
                >
                   <Smile size={20} />
                </button>
                <button 
                  onClick={() => setActivePopover(activePopover === 'sticker' ? null : 'sticker')} 
                  className={`hover:text-emerald-400 transition-colors p-1 ${activePopover === 'sticker' ? 'text-emerald-500' : ''}`}
                >
                   <Sticker size={20} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => handleSend()}
              disabled={sending || (!inputText.trim() && !previewImage)}
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 disabled:opacity-50 bg-primary-600 hover:bg-primary-500 shadow-primary-900/40 glow-primary shrink-0"
            >
              {sending ? <Loader2 className="animate-spin text-slate-900 dark:text-white" size={20} /> : <Send size={22} />}
            </button>
          </div>
        </div>
      </div>

      <CreateGroupModal 
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onCreate={async (p) => {
          await storageService.createGroup(p);
          const dynamicGroups = await storageService.getGroups();
          const baseGroups: ChatGroup[] = [
            { name: 'GRUPO PCP', sheetName: 'CHAT', type: 'group', unreadCount: 0, lastReadCount: 0, members: [] },
            { name: 'LOGÍSTICA INTERNA', sheetName: 'LOG_INT', type: 'group', unreadCount: 0, lastReadCount: 0, members: [] }
          ];
          
          const mapped = dynamicGroups.map(g => ({
            id: g.id,
            name: g.name,
            sheetName: g.sheetName,
            type: 'group' as const,
            unreadCount: 0,
            lastReadCount: 0,
            members: g.members || []
          }));
          
          const final = [...baseGroups];
          mapped.forEach(mg => {
            if (!final.find(f => f.sheetName === mg.sheetName)) final.push(mg);
          });
          
          setGroups(final);
        }}
      />

      <GroupInfoModal 
        isOpen={isGroupInfoModalOpen}
        onClose={() => setIsGroupInfoModalOpen(false)}
        users={users}
        currentUser={currentUser}
        group={activeSession}
        onUpdate={async (id, p) => {
          await storageService.updateGroup(id, p);
          const dynamicGroups = await storageService.getGroups();
          const baseGroups: ChatGroup[] = [
            { name: 'GRUPO PCP', sheetName: 'CHAT', type: 'group', unreadCount: 0, lastReadCount: 0, members: [] },
            { name: 'LOGÍSTICA INTERNA', sheetName: 'LOG_INT', type: 'group', unreadCount: 0, lastReadCount: 0, members: [] }
          ];
          
          const mapped = dynamicGroups.map(g => ({
            id: g.id,
            name: g.name,
            sheetName: g.sheetName,
            type: 'group' as const,
            unreadCount: 0,
            lastReadCount: 0,
            members: g.members || []
          }));
          
          const final = [...baseGroups];
          mapped.forEach(mg => {
            if (!final.find(f => f.sheetName === mg.sheetName)) final.push(mg);
          });
          
          setGroups(final);
          
          if (activeSession.id === id) {
            setActiveSession(prev => ({
              ...prev,
              name: p.name,
              members: p.members
            }));
          }
        }}
      />

      {/* MODAL CONFIGURAÇÃO GOOGLE CHAT */}
      {showGoogleTokenModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="bg-[#0b1324] border border-blue-500/20 max-w-lg w-full rounded-[32px] overflow-hidden p-8 space-y-8 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative">
            {/* Fechar */}
            <button 
              onClick={() => setShowGoogleTokenModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
              <X size={16} />
            </button>

            {/* Ícone & Título */}
            <div className="flex items-center gap-4">
              <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 shadow-xl">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-widest leading-none">CONECTOR GOOGLE CHAT™</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1.5">Sincronização de Canais Corporativos</p>
              </div>
            </div>

            {/* Descrição */}
            <p className="text-xs text-slate-700 leading-relaxed uppercase font-bold tracking-tight">
              Para listar salas e enviar atualizações de AWB operacionais diretamente para o Google Chat corporativo de sua equipe, autorize o aplicativo ou digite o seu código de acesso (OAuth Token) abaixo.
            </p>

            {/* Opções de Conexão */}
            <div className="space-y-6">
              {/* Configuração do Client ID do Google Cloud */}
              <div className="p-5 bg-blue-600/5 border border-blue-500/20 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">PASSO 1: CONFIGURAÇÃO DO SEU CLIENT ID OAUTH</span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">Google Client ID (ID do cliente)</label>
                  <input 
                    type="text"
                    placeholder="Seu ID do Cliente OAuth do Google Cloud Console"
                    value={googleClientId}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setGoogleClientId(val);
                      localStorage.setItem('google_chat_client_id', val);
                    }}
                    className="w-full bg-[#070b14] border border-slate-800 text-xs font-mono text-white rounded-xl px-4 py-3 placeholder:text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                  <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest block">URIs de Redirecionamento Autorizado no Console do Google:</span>
                  <div className="flex gap-2">
                    <input 
                      readOnly
                      value={window.location.origin + window.location.pathname}
                      className="flex-1 bg-black/40 text-[9px] font-mono text-blue-400 rounded border border-white/5 px-2 py-1 select-all focus:outline-none text-ellipsis"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + window.location.pathname);
                        alert("Copiado para a área de transferência!");
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-[8px] uppercase tracking-widest rounded transition-all active:scale-95"
                    >
                      Copiar
                    </button>
                  </div>
                  <p className="text-[7px] text-slate-500 uppercase font-bold leading-normal mt-1">
                    * Adicione esta URI exata nas configurações de credencial do seu Google Cloud Console.
                  </p>
                </div>
              </div>

              {/* Opção 1: Popup Automático */}
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#3b82f6]">PASSO 2: ENTRAR COM CONTA GOOGLE</span>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[7px] font-black tracking-widest px-1.5 py-0.5 rounded">RECOMENDADO</span>
                </div>
                <button 
                  onClick={() => {
                    const DISCO_CLIENT_ID = googleClientId || "1041920786961-oihb1vsc80qge2or948q43v5g6unb7ve.apps.googleusercontent.com";
                    const REDIRECT_URI = window.location.origin + window.location.pathname;
                    const scopes = [
                      'https://www.googleapis.com/auth/chat.messages',
                      'https://www.googleapis.com/auth/chat.spaces'
                    ];
                    const AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${DISCO_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(scopes.join(' '))}`;
                    
                    // Abrir em popup
                    window.open(AUTH_URL, 'Google OAuth', 'width=600,height=600');
                    setShowGoogleTokenModal(false);
                    alert("Aguardando login corporativo do Google... Se o popup não abrir ou disser 'redirecionamento bloqueado', por favor utilize o método alternativo copiando um Token de acesso.");
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Key size={14} /> ENTRAR COM CONTA GOOGLE
                </button>
              </div>

              {/* Opção 2: Entrada Manual */}
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">MÉTODO ALTERNATIVO: DIGITAR TOKEN MANUAL</span>
                <div className="space-y-2">
                  <input 
                    type="password"
                    placeholder="Cole seu Google OAuth Access Token..."
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    className="w-full bg-[#070b14] border border-slate-800 text-xs font-mono text-white rounded-xl px-4 py-3 placeholder:text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[7px] text-slate-600 uppercase font-black tracking-widest leading-normal">
                    Excelente para testes rápidos ou ambientes com restrições de popup de TI.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (!manualTokenInput.trim()) {
                      alert("Digite um token de acesso válido.");
                      return;
                    }
                    setGoogleToken(manualTokenInput.trim());
                    localStorage.setItem('google_chat_token', manualTokenInput.trim());
                    setShowGoogleTokenModal(false);
                    setManualTokenInput('');
                    alert("Google Chat conectado com sucesso através do Token manual!");
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95"
                >
                  CONECTAR VIA TOKEN CHAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
