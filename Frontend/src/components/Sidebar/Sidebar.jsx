import { useState, useRef, useEffect } from 'react';
import {
  SquarePen,
  Search,
  Image as ImageIcon,
  BookOpen,
  Clock,
  Puzzle,
  FolderClosed,
  Terminal,
  MoreHorizontal,
  Circle,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  LogOut,
  Settings,
  ChevronUp,
} from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar({
  isOpen,
  onToggleSidebar,
  onNewChat,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAllHistory,
  user,
  onLogout,
}) {
  const [activeMenu, setActiveMenu] = useState('Projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const filteredSessions = sessions.filter((s) =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  const userName = user?.name || 'Mussa Esliman';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.collapsed}`}>
      {/* Top Header */}
      <div className={styles.header}>
        <span className={styles.logoTitle}>ChatGPT</span>
        <div className={styles.headerIcons}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setIsSearching((prev) => !prev)}
            title="Search chats"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onToggleSidebar}
            title="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className={styles.newChatWrapper}>
        <button
          type="button"
          className={styles.newChatBtn}
          onClick={onNewChat}
        >
          <SquarePen size={18} />
          <span>New chat</span>
        </button>
      </div>

      {/* Search Input Bar (when toggled) */}
      {isSearching && (
        <div className={styles.searchBarWrapper}>
          <Search size={14} className={styles.searchBarIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search recent chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {/* Scrollable Navigation & History */}
      <div className={styles.scrollContent}>
        {/* Navigation Tools matching Screenshot */}
        <div className={styles.menuSection}>
          <button
            type="button"
            className={`${styles.menuItem} ${activeMenu === 'Images' ? styles.active : ''}`}
            onClick={() => setActiveMenu('Images')}
          >
            <ImageIcon size={18} />
            <span>Images</span>
          </button>

          <button
            type="button"
            className={`${styles.menuItem} ${activeMenu === 'Library' ? styles.active : ''}`}
            onClick={() => setActiveMenu('Library')}
          >
            <BookOpen size={18} />
            <span>Library</span>
          </button>

          <button
            type="button"
            className={`${styles.menuItem} ${activeMenu === 'Scheduled' ? styles.active : ''}`}
            onClick={() => setActiveMenu('Scheduled')}
          >
            <Clock size={18} />
            <span>Scheduled</span>
          </button>

          <button
            type="button"
            className={`${styles.menuItem} ${activeMenu === 'Plugins' ? styles.active : ''}`}
            onClick={() => setActiveMenu('Plugins')}
          >
            <Puzzle size={18} />
            <span>Plugins</span>
          </button>

          <button
            type="button"
            className={`${styles.menuItem} ${activeMenu === 'Projects' ? styles.active : ''}`}
            onClick={() => setActiveMenu('Projects')}
          >
            <FolderClosed size={18} />
            <span>Projects</span>
          </button>

          <button
            type="button"
            className={`${styles.menuItem} ${activeMenu === 'Codex' ? styles.active : ''}`}
            onClick={() => setActiveMenu('Codex')}
          >
            <Terminal size={18} />
            <span>Codex</span>
          </button>

          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {}}
          >
            <MoreHorizontal size={18} />
            <span>More</span>
          </button>
        </div>

        {/* Pinned Section */}
        <div className={styles.sectionHeader}>Pinned</div>
        <div className={styles.pinnedSection}>
          <button type="button" className={styles.historyItem}>
            <Circle size={14} className={styles.pinnedDot} />
            <span className={styles.historyTitle}>Add description and image</span>
          </button>
        </div>

        {/* Recents / Chat History Section */}
        <div className={styles.recentsHeaderRow}>
          <span className={styles.sectionHeader}>Recents</span>
          {sessions.length > 0 && (
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={onClearAllHistory}
              title="Clear all chat history"
            >
              Clear
            </button>
          )}
        </div>

        <div className={styles.historySection}>
          {filteredSessions.length === 0 ? (
            <div className={styles.noHistory}>
              {searchQuery ? 'No matching chats' : 'No recent chats yet'}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`${styles.historyItemRow} ${
                  currentSessionId === session.id ? styles.activeHistory : ''
                }`}
              >
                <button
                  type="button"
                  className={styles.historyItemBtn}
                  onClick={() => onSelectSession(session.id)}
                  title={session.title}
                >
                  <MessageSquare size={14} className={styles.chatIcon} />
                  <span className={styles.historyTitle}>{session.title}</span>
                </button>

                <button
                  type="button"
                  className={styles.deleteChatBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Profile Footer & Logout Popover (No Upgrade Button) */}
      <div className={styles.footer} ref={profileMenuRef}>
        {/* Profile Popover Menu */}
        {isProfileMenuOpen && (
          <div className={styles.profilePopover}>
            <div className={styles.popoverHeader}>
              <div className={styles.avatarPurpleSmall}>
                <span>{userInitials}</span>
              </div>
              <div className={styles.popoverUserInfo}>
                <span className={styles.popoverUserName}>{userName}</span>
                <span className={styles.popoverUserEmail}>
                  {user?.email || 'mussa@example.com'}
                </span>
              </div>
            </div>

            <div className={styles.popoverDivider} />

            <button
              type="button"
              className={styles.popoverItem}
              onClick={() => setIsProfileMenuOpen(false)}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>

            <div className={styles.popoverDivider} />

            <button
              type="button"
              className={`${styles.popoverItem} ${styles.logoutItem}`}
              onClick={() => {
                setIsProfileMenuOpen(false);
                onLogout();
              }}
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        )}

        <div
          className={styles.userProfile}
          onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          title="User menu"
        >
          <div className={styles.avatarPurple}>
            <span>{userInitials}</span>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userTier}>Active Account</span>
          </div>
          <ChevronUp size={14} className={styles.chevronIcon} />
        </div>
      </div>
    </aside>
  );
}
