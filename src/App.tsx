import { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { ChatMessage, MenuItem, ActiveView, UserProfile } from './types';
import { sendChatMessage } from './services/aiService';
import {
  getUserProfile,
  logoutUser,
  subscribeToAuth,
  canUseFeature,
  consumeFeatureUsage,
} from './services/accessControlService';
import { recordAiUsage, saveAiHistory } from './services/storageService';
import {
  getUserChatMessages,
  saveUserChatMessages,
  clearUserChatMessages,
} from './services/chatStorageService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { ChatMessageItem } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { LoadingIndicator } from './components/LoadingIndicator';
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
import { LoginView } from './components/LoginView';
import { RegisterView } from './components/RegisterView';
import { ForgotPasswordView } from './components/ForgotPasswordView';
import { AsLogo } from './components/AsLogo';
import { FeaturePlaceholderModal } from './components/FeaturePlaceholderModal';
import { OptionsMenuModal } from './components/OptionsMenuModal';
import { AdminPanel } from './components/admin/AdminPanel';
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
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [placeholderItem, setPlaceholderItem] = useState<MenuItem | null>(null);

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
      if (window.location.pathname.startsWith('/admin')) {
        setAppRoute('admin');
      } else {
        setAppRoute('dashboard');
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
    setActiveView('chat');
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
      setActiveView('chat');
      window.history.pushState(null, '', '/dashboard');
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Send user message to Gemini
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText ?? inputText).trim();
    if (!textToSend || isLoading) return;

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

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    // If customText wasn't passed, clear the input
    if (!customText) {
      setInputText('');
    }

    const nextMessages = [...messages.filter((m) => !m.isError), userMessage];
    setMessages(nextMessages);
    setIsLoading(true);

    try {
      // Send conversational history to server-side Gemini service
      const historyPayload = nextMessages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const replyText = await sendChatMessage(historyPayload);

      // Record quota consumption on success
      await consumeFeatureUsage('chat');

      // Auto-save chat history
      try {
        await recordAiUsage('Chat AI');
        await saveAiHistory({
          feature: 'Chat AI',
          title: textToSend.slice(0, 50),
          inputSummary: textToSend,
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
        <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md mb-4">
          <AsLogo className="w-8 h-8" />
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
      {/* Header */}
      <Header
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenMenu={() => setIsOptionsMenuOpen(true)}
        hasMessages={messages.length > 0}
        activeView={activeView}
      />

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
      ) : (
        <>
          {/* Main Conversation Canvas */}
          <main
            id="chat-main-container"
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col w-full"
          >
            <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col py-3 sm:py-4">
              {messages.length === 0 ? (
                <EmptyState />
              ) : (
                <div id="messages-list" className="flex-1 flex flex-col w-full">
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

          {/* Chat Input Container */}
          <footer id="chat-footer" className="w-full shrink-0">
            <ChatInput
              value={inputText}
              onChange={setInputText}
              onSend={() => handleSendMessage()}
              isLoading={isLoading}
              placeholder="Tulis pesan atau pertanyaan kontenmu..."
            />
          </footer>
        </>
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
    </div>
  );
}
