import { useState, useEffect, useRef } from 'react';
import { Bot, ArrowDown } from 'lucide-react';
import ChatMessage from '../ChatMessage/ChatMessage';
import styles from './MessageList.module.css';

export default function MessageList({
  conversations,
  isLoading,
  messagesEndRef,
  onScrollChange,
}) {
  const containerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (onScrollChange) {
      onScrollChange(scrollTop > 10);
    }
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isFarFromBottom);
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, isLoading, messagesEndRef]);

  return (
    <div
      ref={containerRef}
      className={styles.messages}
      onScroll={handleScroll}
    >
      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          <h1 className={styles.heroTitle}>Where should we begin?</h1>
        </div>
      ) : (
        <div className={styles.messageFeed}>
          {conversations.map((msg, index) => (
            <ChatMessage
              key={msg.id ?? `msg_${index}`}
              role={msg.role}
              content={msg.content}
              files={msg.files}
            />
          ))}

          {isLoading && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingAvatar}>
                <Bot size={18} color="white" />
              </div>
              <div className={styles.loadingBubble}>
                <div className={styles.loadingDots}>
                  <div className={styles.loadingDot}></div>
                  <div className={styles.loadingDot}></div>
                  <div className={styles.loadingDot}></div>
                </div>
                <span className={styles.loadingText}>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={messagesEndRef} className={styles.bottomAnchor} />

      {showScrollBottom && (
        <button
          type="button"
          className={styles.scrollToBottomBtn}
          onClick={handleScrollToBottom}
          title="Scroll to bottom"
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
}
