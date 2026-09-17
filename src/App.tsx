import { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { ChatMessage, MenuItem, ActiveView, UserProfile, ChatImageAttachment } from './types';
import { sendChatMessage } from './services/aiService';
import {
  getUserProfile,
  logoutUser,
  subscribeToAuth,
  canUseFeature,
  consumeFeatureUsage,
  getChatDailyUsage,
} from './services/accessControlService';
import { recordAiUsage, saveAiHistory } from './services/storageService';
import {
  getUserChatMessages,
  saveUserChatMessages,
  clearUserChatMessages,
} from './services/chatStorageService';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { CreateWorkspaceEmpty } from './components/CreateWorkspaceEmpty';
import { ChatMessageItem } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { LoadingIndicator } from './components/LoadingIndicator';
import { QuotaExceededModal } from './components/QuotaExceededModal';
import { ContentAnalyzer } from './components/ContentAnalyzer';
import { ContentIdeas } from './components/ContentIdeas';
import { CaptionMaker } from './components/CaptionMaker';
import { HookGenerator } from './components/HookGenerator';
import { ScriptMaker } from './components/ScriptMaker';
import { HashtagGenerator } from './components/HashtagGenerator';
import { ContentPlanner } from './components/ContentPlanner';
import { Analytics } from './components/Analytics';
import { History } from './components/History';
import { AccountDashboard } from './components/AccountDashboard';
import { Profile } from './components/Profile';
import { Premium } from './components/Premium';
import { Credits } from './components/Credits';
import { Settings } from './components/Settings';
import { AboutArvinStudio } from './components/AboutArvinStudio';
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { ForgotPasswordView } from './components/ForgotPasswordView';
import { AsLogo } from './components/AsLogo';
import { AppLogo } from './components/AppLogo';
import { FeaturePlaceholderModal } from './components/FeaturePlaceholderModal';
import { OptionsMenuModal } from './components/OptionsMenuModal';
import { AdminPanel } from './components/admin/AdminPanel';
import { EditVideoContainer } from './components/video/EditVideoContainer';
import { AiVideoAdView } from './components/video/AiVideoAdView';
import { SuperAdminGuard } from './components/admin/SuperAdminGuard';

export default function App() {
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [unauthView, setUnauthView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [appRoute, setAppRoute] = useState<'dashboard' | 'admin'>(() => {
    return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
      ? 'admin'
      : 'dashboard';
  });
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/edit-video') return 'edit-video';
      if (path === '/ai-video-ad' || path === '/video-iklan') return 'ai-video-ad';
    }
    return 'home';
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [placeholderItem, setPlaceholderItem] = useState<MenuItem | null>(null);
  const [pendingVideoForEditor, setPendingVideoForEditor] = useState<{ url: string; name: string } | null>(null);

  // Chat AI daily quota tracking (3 Free Credit / day for FREE users, unlimited for Premium)
  const [chatQuota, setChatQuota] = useState<{
    count: number;
    limit: number;
    remaining: number;
    isPremium: boolean;
  }>({ count: 0, limit: 3, remaining: 3, isPremium: false });
  const [showChatQuotaModal, setShowChatQuotaModal] = useState(false);

  const refreshChatQuota = async () => {
    try {
      const q = await getChatDailyUsage();
      setChatQuota(q);
    } catch (err) {
      console.warn('Error fetching Chat AI quota:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshChatQuota();
    }
  }, [currentUser, activeView]);

  // Load & isolate chat history per authenticated user account
  const activeUserId = currentUser?.id || null;
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      setInputText('');
      activeUserIdRef.current = null;
    } else {
      if (activeUserIdRef.current !== activeUserId) {
        const stored = getUserChatMessages(activeUserId);
        setMessages(stored);
        setInputText('');
        activeUserIdRef.current = activeUserId;
      }
    }
  }, [activeUserId]);

  // Persist current user's chat messages whenever they change
  useEffect(() => {
    if (activeUserId && messages.length > 0) {
      saveUserChatMessages(activeUserId, messages);
    }
  }, [messages, activeUserId]);

  // Sync route with browser history (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        setAppRoute('admin');
      } else {
        setAppRoute('dashboard');
        if (path === '/edit-video') {
          setActiveView('edit-video');
        } else if (path === '/ai-video-ad' || path === '/video-iklan') {
          setActiveView('ai-video-ad');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setMessages([]);
        setInputText('');
        activeUserIdRef.current = null;
        setAuthChecking(false);
      } else {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setCurrentUser(profile);
          activeUserIdRef.current = profile.id;
          const userMsgs = getUserChatMessages(profile.id);
          setMessages(userMsgs);
          if (profile.role === 'SUPER_ADMIN') {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/dashboard')) {
              setAppRoute('admin');
              window.history.replaceState(null, '', '/admin');
            }
          }
        } catch (err) {
          console.warn('Could not load user profile on auth change:', err);
          setCurrentUser(null);
          setMessages([]);
          activeUserIdRef.current = null;
        } finally {
          setAuthChecking(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setMessages([]);
    setInputText('');
    activeUserIdRef.current = null;
    setUnauthView('login');
    setActiveView('home');
    setAppRoute('dashboard');
    window.history.pushState(null, '', '/');
    setIsSidebarOpen(false);
    setIsOptionsMenuOpen(false);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    activeUserIdRef.current = user.id;
    const userMsgs = getUserChatMessages(user.id);
    setMessages(userMsgs);
    setInputText('');
    if (user.role === 'SUPER_ADMIN') {
      setAppRoute('admin');
      window.history.pushState(null, '', '/admin');
    } else {
      setAppRoute('dashboard');
      setActiveView('home');
      window.history.pushState(null, '', '/dashboard');
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [attachedImage, setAttachedImage] = useState<ChatImageAttachment | null>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    if (activeView === 'chat') {
      scrollToBottom('smooth');
    }
  }, [messages, isLoading, activeView]);

  // Send user message to Gemini (with optional image attachment)
  const handleSendMessage = async (customText?: string, customImage?: ChatImageAttachment) => {
    const imgToSend = customImage ?? attachedImage;
    let textToSend = (customText ?? inputText).trim();

    if ((!textToSend && !imgToSend) || isLoading) return;

    if (!textToSend && imgToSend) {
      textToSend = 'Tolong analisis gambar atau screenshot ini secara detail, berikan evaluasi insight, dan rekomendasi pembuatan konten atau copy/caption yang relevan.';
    }

    // Check daily usage quota for FREE accounts (3x/day Chat AI)
    const quotaCheck = await canUseFeature('chat');
    if (!quotaCheck.allowed) {
      setShowChatQuotaModal(true);
      const quotaErrorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Limit harian Chat AI untuk akun FREE sudah mencapai batas maksimal (3× per hari). Kuota akan di-reset otomatis besok (00:00 WIB), atau upgrade ke Premium untuk chat tanpa batas.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, quotaErrorMsg]);
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: textToSend,
      image: imgToSend || undefined,
      timestamp: new Date(),
    };

    // If customText wasn't passed, clear the input
    if (!customText) {
      setInputText('');
    }
    setAttachedImage(null);

    const nextMessages = [...messages.filter((m) => !m.isError), userMessage];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      // Send conversational history to server-side Gemini service with multimodal image support
      const historyPayload = nextMessages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          text: m.text,
          image: m.image,
        }));

      const replyText = await sendChatMessage(historyPayload);

      // Record quota consumption on success
      const consumeRes = await consumeFeatureUsage('chat');
      setChatQuota((prev) => ({
        ...prev,
        count: 3 - consumeRes.remaining,
        remaining: consumeRes.remaining,
      }));

      // Auto-save chat history
      try {
        await recordAiUsage('Chat AI');
        await saveAiHistory({
          feature: 'Chat AI',
          title: imgToSend ? `[Gambar] ${textToSend.slice(0, 40)}` : textToSend.slice(0, 50),
          inputSummary: imgToSend ? `[Gambar: ${imgToSend.name || 'Screenshot'}] ${textToSend}` : textToSend,
          result: replyText,
        });
      } catch (saveErr) {
        console.warn('Auto-save chat history error:', saveErr);
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('Failed to receive AI response:', err);
      const errMsg = err instanceof Error ? err.message : 'Terjadi masalah saat menghubungkan ke ARVIN AI.';
      const errorChatMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: errMsg,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry the last message when error occurs without duplicating user bubble
  const handleRetryLast = async () => {
    if (isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Check daily usage quota for FREE accounts (5x/day)
    const quotaCheck = await canUseFeature('chat');
    if (!quotaCheck.allowed) {
      const quotaErrorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Limit harian Chat AI untuk akun FREE sudah habis. Coba lagi besok atau upgrade ke Premium.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, quotaErrorMsg]);
      return;
    }

    // Filter out error messages from messages state
    const cleanMessages = messages.filter((m) => !m.isError);
    setMessages(cleanMessages);
    setIsLoading(true);

    try {
      const historyPayload = cleanMessages.map((m) => ({
        role: m.role,
        text: m.text,
        image: m.image,
      }));

      const replyText = await sendChatMessage(historyPayload);
      await consumeFeatureUsage('chat');

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('Retry failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Terjadi masalah saat menghubungkan ke ARVIN AI.';
      const errorChatMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: errMsg,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat Baru: Resets active view to empty chat state and clears active user's chat history
  const handleNewChat = () => {
    if (activeUserId) {
      clearUserChatMessages(activeUserId);
    }
    setMessages([]);
    setInputText('');
    setIsLoading(false);
    setActiveView('chat');
  };

  // ----------------------------------------------------
  // AUTHENTICATION GUARD
  // ----------------------------------------------------
  if (authChecking) {
    return (
      <div id="auth-loading-screen" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-500">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md mb-4 overflow-hidden p-2">
          <AppLogo type="splash" size={36} variant="light" className="w-8 h-8" />
        </div>
        <RefreshCw className="w-5 h-5 animate-spin text-slate-600 mb-2" />
        <p className="text-xs font-semibold text-slate-600">Menghubungkan ke ARVIN STUDIO...</p>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUTING: SUPER ADMIN PANEL ROUTE (/admin)
  // ----------------------------------------------------
  if (appRoute === 'admin') {
    return (
      <SuperAdminGuard
        currentUser={currentUser}
        onNavigateToLogin={() => {
          setUnauthView('login');
          setAppRoute('dashboard');
          window.history.pushState(null, '', '/login');
        }}
        onNavigateToUserDashboard={() => {
          setAppRoute('dashboard');
          window.history.pushState(null, '', '/dashboard');
        }}
      >
        <AdminPanel
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchToUserDashboard={() => {
            setAppRoute('dashboard');
            window.history.pushState(null, '', '/dashboard');
          }}
        />
      </SuperAdminGuard>
    );
  }

  // If user is not authenticated: ONLY render Auth Views. Sidebar is completely suppressed!
  if (!currentUser) {
    if (unauthView === 'register') {
      return (
        <RegisterView
          onRegisterSuccess={handleLoginSuccess}
          onNavigateToLogin={() => setUnauthView('login')}
        />
      );
    }

    if (unauthView === 'forgot-password') {
      return (
        <ForgotPasswordView
          onNavigateToLogin={() => setUnauthView('login')}
        />
      );
    }

    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setUnauthView('register')}
        onNavigateToForgotPassword={() => setUnauthView('forgot-password')}
      />
    );
  }

  // ----------------------------------------------------
  // AUTHENTICATED APP SCREEN
  // ----------------------------------------------------
  return (
    <div
      id="arvin-studio-root"
      className="flex flex-col h-dvh w-full bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans select-text"
    >
      {/* Header (Hidden for dedicated Edit Video studio workspace) */}
      {activeView !== 'edit-video' && (
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenMenu={() => setIsOptionsMenuOpen(true)}
          hasMessages={messages.length > 0}
          activeView={activeView}
          currentUser={currentUser}
          onNavigate={setActiveView}
        />
      )}

      {/* Screen Content */}
      {activeView === 'account' ? (
        <AccountDashboard
          onNavigate={setActiveView}
          onBackToChat={() => setActiveView('chat')}
          onNavigateToAdmin={() => {
            setAppRoute('admin');
            window.history.pushState(null, '', '/admin');
          }}
        />
      ) : activeView === 'profile' ? (
        <Profile
          onBack={() => setActiveView('account')}
          onNavigate={setActiveView}
        />
      ) : activeView === 'premium' ? (
        <Premium onBack={() => setActiveView('account')} />
      ) : activeView === 'credits' ? (
        <Credits onBack={() => setActiveView('account')} />
      ) : activeView === 'settings' ? (
        <Settings
          onBack={() => setActiveView('account')}
          onNavigate={setActiveView}
          onLogout={handleLogout}
          userEmail={currentUser?.email}
        />
      ) : activeView === 'about' ? (
        <AboutArvinStudio
          onBack={() => setActiveView('settings')}
          userEmail={currentUser?.email}
          currentUser={currentUser}
          onNavigate={setActiveView}
        />
      ) : activeView === 'content-analyzer' ? (
        <ContentAnalyzer
          onBackToChat={() => setActiveView('chat')}
          onNavigate={setActiveView}
        />
      ) : activeView === 'content-ideas' ? (
        <ContentIdeas
          onBackToChat={() => setActiveView('chat')}
          onNavigate={setActiveView}
        />
      ) : activeView === 'caption-maker' ? (
        <CaptionMaker
          onBackToChat={() => setActiveView('chat')}
          onNavigate={setActiveView}
        />
      ) : activeView === 'hook-generator' ? (
        <HookGenerator
          onBackToChat={() => setActiveView('chat')}
          onNavigate={setActiveView}
        />
      ) : activeView === 'script-maker' ? (
        <ScriptMaker
          onBackToChat={() => setActiveView('chat')}
          onNavigate={setActiveView}
        />
      ) : activeView === 'hashtag-generator' ? (
        <HashtagGenerator
          onBackToChat={() => setActiveView('chat')}
          onNavigate={setActiveView}
        />
      ) : activeView === 'content-planner' ? (
        <ContentPlanner onBackToChat={() => setActiveView('chat')} />
      ) : activeView === 'analytics' ? (
        <Analytics onBackToChat={() => setActiveView('chat')} />
      ) : activeView === 'history' ? (
        <History
          onBackToChat={() => setActiveView('chat')}
          onNavigateToTool={(toolId) => setActiveView(toolId as ActiveView)}
        />
      ) : activeView === 'edit-video' ? (
        <EditVideoContainer
          currentUser={currentUser}
          onNavigate={setActiveView}
          initialVideoUrl={pendingVideoForEditor?.url}
          initialVideoName={pendingVideoForEditor?.name}
        />
      ) : activeView === 'ai-video-ad' ? (
        <main
          id="ai-video-ad-main-container"
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col w-full pb-24 sm:pb-8"
        >
          <AiVideoAdView
            currentUser={currentUser}
            onUpgrade={() => setActiveView('premium')}
            onNavigateToEditVideo={(videoPayload) => {
              if (videoPayload && videoPayload.videoUrl) {
                const targetUrl = videoPayload.videoUrl;
                const targetName = `${videoPayload.productName || 'Iklan'}.mp4`;
                setPendingVideoForEditor({ url: targetUrl, name: targetName });
              }
              setActiveView('edit-video');
            }}
          />
        </main>
      ) : activeView === 'home' ? (
        /* ---------------- Home Studio Dashboard (No Chat Footer!) ---------------- */
        <main
          id="home-main-container"
          className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col w-full pb-24 sm:pb-8"
        >
          <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col py-3 sm:py-4">
            <EmptyState
              onSelectImage={(attachment) => {
                setAttachedImage(attachment);
                setActiveView('chat');
              }}
              onSelectPrompt={(promptText) => {
                setActiveView('chat');
                handleSendMessage(promptText);
              }}
              onNavigate={setActiveView}
              currentUser={currentUser}
              chatQuota={chatQuota}
            />
          </div>
        </main>
      ) : (
        /* ---------------- Create & Chat AI Workspace ---------------- */
        <div id="chat-workspace-view" className="flex-1 flex flex-col w-full overflow-hidden relative">
          {/* Main Conversation Canvas or Create Workspace Starter */}
          <main
            id="chat-main-container"
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col w-full"
          >
            <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col py-3 sm:py-4">
              {messages.length === 0 ? (
                <CreateWorkspaceEmpty
                  onSelectPrompt={(promptText) => {
                    setInputText(promptText);
                    setTimeout(() => {
                      const textarea = document.getElementById('chat-textarea');
                      textarea?.focus();
                    }, 60);
                  }}
                  onSelectImage={(attachment) => {
                    setAttachedImage(attachment);
                  }}
                />
              ) : (
                <div id="messages-list" className="flex-1 flex flex-col w-full px-3 sm:px-0">
                  {messages.map((msg, index) => (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      onRetry={handleRetryLast}
                      isLast={index === messages.length - 1}
                    />
                  ))}

                  {isLoading && <LoadingIndicator />}
                  <div ref={messagesEndRef} className="h-1 shrink-0" />
                </div>
              )}
            </div>
          </main>

          {/* Chat Input Container cleanly docked right above mobile bottom nav */}
          <footer
            id="chat-footer"
            className="w-full shrink-0 mb-[56px] sm:mb-0 bg-white border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] pt-1"
          >
            {/* Chat AI Credit Status Pill */}
            <div className="max-w-3xl mx-auto px-4 pb-0.5 flex items-center justify-between text-xs text-slate-500 select-none">
              <div className="flex items-center gap-2 font-medium">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    chatQuota.isPremium
                      ? 'bg-amber-500'
                      : chatQuota.remaining > 0
                      ? 'bg-emerald-500'
                      : 'bg-rose-500'
                  }`}
                />
                {chatQuota.isPremium ? (
                  <span className="text-amber-700 font-semibold flex items-center gap-1">
                    Chat AI: Akses Tanpa Batas (Premium)
                  </span>
                ) : (
                  <span>
                    Chat AI Gratis: <strong className="text-slate-800">{chatQuota.remaining}/3</strong> hari ini
                    {chatQuota.remaining === 0 && (
                      <span className="text-rose-600 font-bold ml-1.5">
                        (Limit Tercapai)
                      </span>
                    )}
                  </span>
                )}
              </div>

              {!chatQuota.isPremium && (
                <div>
                  {chatQuota.remaining === 0 ? (
                    <button
                      id="btn-upgrade-from-chat-footer"
                      type="button"
                      onClick={() => setActiveView('premium')}
                      className="text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Upgrade ke Premium &rarr;
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Reset: 00:00 WIB
                    </span>
                  )}
                </div>
              )}
            </div>

            <ChatInput
              value={inputText}
              onChange={setInputText}
              onSend={() => {
                if (!chatQuota.isPremium && chatQuota.remaining === 0) {
                  setShowChatQuotaModal(true);
                  return;
                }
                handleSendMessage();
              }}
              isLoading={isLoading}
              placeholder={
                !chatQuota.isPremium && chatQuota.remaining === 0
                  ? 'Limit Chat AI harian (3/3) telah habis. Upgrade ke Premium untuk melanjutkan...'
                  : 'Tulis ide, topik konten, atau tanya AI...'
              }
              attachedImage={attachedImage}
              onAttachImage={setAttachedImage}
            />
          </footer>
        </div>
      )}

      {/* Navigation Sidebar (Only rendered when logged in!) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={handleNewChat}
        activeView={activeView}
        onSelectView={setActiveView}
        onSelectFeaturePlaceholder={(item) => {
          setIsSidebarOpen(false);
          setPlaceholderItem(item);
        }}
        isSuperAdmin={currentUser?.role === 'SUPER_ADMIN'}
        isPremium={currentUser?.plan === 'PREMIUM' && currentUser?.subscriptionStatus === 'ACTIVE'}
        userName={currentUser?.fullName}
        userPhotoURL={currentUser?.photoURL}
        onNavigateToAdmin={() => {
          setAppRoute('admin');
          window.history.pushState(null, '', '/admin');
        }}
      />

      {/* Inactive Features Placeholder Modal */}
      <FeaturePlaceholderModal
        item={placeholderItem}
        onClose={() => setPlaceholderItem(null)}
      />

      {/* Top Right Options Modal */}
      <OptionsMenuModal
        isOpen={isOptionsMenuOpen}
        onClose={() => setIsOptionsMenuOpen(false)}
        onNewChat={handleNewChat}
        messageCount={messages.length}
        onNavigate={setActiveView}
      />

      {/* Quota Exceeded Modal for Chat AI */}
      <QuotaExceededModal
        isOpen={showChatQuotaModal}
        featureKey="chat"
        featureLabel="Chat AI"
        onClose={() => setShowChatQuotaModal(false)}
        onUpgrade={() => {
          setShowChatQuotaModal(false);
          setActiveView('premium');
        }}
      />

      {/* Mobile-First Bottom Navigation (Hidden for dedicated Edit Video studio workspace) */}
      {activeView !== 'edit-video' && (
        <BottomNav
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onNewChat={handleNewChat}
          hasMessages={messages.length > 0}
        />
      )}
    </div>
  );
}
