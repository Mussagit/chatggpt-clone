import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar/Sidebar';
import ChatHeader from './components/ChatHeader/ChatHeader';
import MessageList from './components/MessageList/MessageList';
import ChatInput from './components/ChatInput/ChatInput';
import AuthModal from './components/AuthModal/AuthModal';
import './App.css';

const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
const API_BASE = rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase}/api`;

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('chatgpt_user');
    return saved
      ? JSON.parse(saved)
      : { name: 'Mussa Esliman', email: 'mussa@example.com' };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('chatgpt_logged_out') !== 'true';
  });

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const messagesEndRef = useRef(null);

  // Fetch all chat sessions (for sidebar Recents list)
  const fetchSessions = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await axios.get(`${API_BASE}/chat/sessions`);
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, [isAuthenticated]);

  // Fetch messages for a specific chat session
  const loadSessionMessages = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const res = await axios.get(`${API_BASE}/chat/sessions/${sessionId}/messages`);
      if (res.data.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const initialize = async () => {
      try {
        const res = await axios.get(`${API_BASE}/chat/sessions`);
        if (!isMounted) return;

        if (res.data.success && res.data.data.length > 0) {
          const allSessions = res.data.data;
          setSessions(allSessions);
          const latestSession = allSessions[0];
          setCurrentSessionId(latestSession.id);

          const msgRes = await axios.get(
            `${API_BASE}/chat/sessions/${latestSession.id}/messages`
          );
          if (isMounted && msgRes.data.success) {
            setConversations(msgRes.data.data);
          }
        }
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Responsive sidebar collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Switch to a selected chat from sidebar
  const handleSelectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    loadSessionMessages(sessionId);
    setIsScrolled(false);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Delete a specific chat from history
  const handleDeleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API_BASE}/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (currentSessionId === sessionId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Start a fresh conversation
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setConversations([]);
    setIsScrolled(false);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Clear all chats from history
  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all chat history?')) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/chat/conversations`);
      setSessions([]);
      setConversations([]);
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  // Log in
  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('chatgpt_user', JSON.stringify(userData));
    localStorage.removeItem('chatgpt_logged_out');
    fetchSessions();
  };

  // Log out
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('chatgpt_logged_out', 'true');
    setCurrentSessionId(null);
    setConversations([]);
    setSessions([]);
  };

  // Send message with ultra-fast direct Gemini generation (zero polling delay, supports Photos and PDFs)
  const handleSendMessage = async (question, files = [], isThinkMode = false) => {
    const tempUserId = `temp_${Date.now()}`;

    // Optimistically render user message instantly with files
    const optimisticUserMessage = {
      id: tempUserId,
      role: 'user',
      content: question,
      files: files || [],
    };

    setConversations((prev) => [...prev, optimisticUserMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/chat/conversations`, {
        question,
        files: files || [],
        sessionId: currentSessionId,
        isThinkMode,
      });

      if (response.data.success) {
        const { sessionId, sessionTitle, userMessage, assistantMessage } =
          response.data.data;

        // Update active session ID
        setCurrentSessionId(sessionId);

        // Replace temp message with server generated user & assistant messages
        setConversations((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserId);
          return [...filtered, userMessage, assistantMessage];
        });

        // Update sidebar sessions list
        setSessions((prev) => {
          const existingIndex = prev.findIndex((s) => s.id === sessionId);
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              title: sessionTitle || updated[existingIndex].title,
              updated_at: new Date().toISOString(),
            };
            return updated;
          }
          return [
            {
              id: sessionId,
              title: sessionTitle,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Something went wrong while communicating with Gemini. Please try again.';

      setConversations((prev) => [
        ...prev.filter((m) => m.id !== tempUserId),
        optimisticUserMessage,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `❌ ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      fetchSessions();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app">
      {/* Auth Modal when logged out */}
      {!isAuthenticated && <AuthModal onLogin={handleLogin} />}

      {/* Mobile backdrop */}
      <div
        className={`sidebarOverlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onNewChat={handleNewChat}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAllHistory={handleClearAllHistory}
        user={user}
        onLogout={handleLogout}
      />

      <main className="chat">
        <ChatHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          user={user}
          onLogout={handleLogout}
          onNewChat={handleNewChat}
          isScrolled={isScrolled}
        />

        <MessageList
          conversations={conversations}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          onScrollChange={setIsScrolled}
        />

        <ChatInput
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}
