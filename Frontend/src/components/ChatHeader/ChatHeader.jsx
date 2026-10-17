import { useState, useRef, useEffect } from 'react';
import {
  PanelLeft,
  SquarePen,
  LogOut,
  Settings,
} from 'lucide-react';
import styles from './ChatHeader.module.css';

export default function ChatHeader({
  isSidebarOpen,
  onToggleSidebar,
  user,
  onLogout,
  onNewChat,
  isScrolled = false,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user?.name || 'Mussa Esliman';
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      {/* Left: Sidebar Toggle when sidebar is closed */}
      <div className={styles.left}>
        {!isSidebarOpen && (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onToggleSidebar}
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <PanelLeft size={20} />
          </button>
        )}
      </div>

      {/* Right: New Chat Shortcut & User Profile Menu */}
      <div className={styles.right} ref={menuRef}>
        <button
          type="button"
          className={styles.headerNewChatBtn}
          onClick={onNewChat}
          title="New chat"
        >
          <SquarePen size={18} />
        </button>

        <div
          className={styles.avatarPurple}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          title={`${userName} (Click for menu)`}
        >
          <span>{userInitials}</span>
        </div>

        {/* Profile Popover Menu */}
        {isMenuOpen && (
          <div className={styles.headerPopover}>
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
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings size={15} />
              <span>Settings</span>
            </button>

            <div className={styles.popoverDivider} />

            <button
              type="button"
              className={`${styles.popoverItem} ${styles.logoutItem}`}
              onClick={() => {
                setIsMenuOpen(false);
                onLogout();
              }}
            >
              <LogOut size={15} />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

