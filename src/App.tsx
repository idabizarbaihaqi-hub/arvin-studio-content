import { useState, useRef, useEffect } from 'react';
import { ChatMessage, MenuItem, ActiveView } from './types';
import { sendChatMessage } from './services/aiService';
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
import { FeaturePlaceholderModal } from './components/FeaturePlaceholderModal';
import { OptionsMenuModal } from './components/OptionsMenuModal';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [placeholderItem, setPlaceholderItem] = useState<MenuItem | null>(null);

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

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('Failed to receive AI response:', err);
      const errorChatMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Terjadi masalah saat menghubungkan ke ARVIN AI.',
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

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('Retry failed:', err);
      const errorChatMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'Terjadi masalah saat menghubungkan ke ARVIN AI.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat Baru: Resets active view to empty chat state
  const handleNewChat = () => {
    setMessages([]);
    setInputText('');
    setIsLoading(false);
    setActiveView('chat');
  };

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

      {/* Screen Content: Content Analyzer, Content Ideas, Caption Maker, Hook Generator, Script Maker, Hashtag Generator, OR Chat Utama */}
      {activeView === 'content-analyzer' ? (
        <ContentAnalyzer onBackToChat={() => setActiveView('chat')} />
      ) : activeView === 'content-ideas' ? (
        <ContentIdeas onBackToChat={() => setActiveView('chat')} />
      ) : activeView === 'caption-maker' ? (
        <CaptionMaker onBackToChat={() => setActiveView('chat')} />
      ) : activeView === 'hook-generator' ? (
        <HookGenerator onBackToChat={() => setActiveView('chat')} />
      ) : activeView === 'script-maker' ? (
        <ScriptMaker onBackToChat={() => setActiveView('chat')} />
      ) : activeView === 'hashtag-generator' ? (
        <HashtagGenerator onBackToChat={() => setActiveView('chat')} />
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

      {/* Navigation Sidebar */}
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
      />
    </div>
  );
}

