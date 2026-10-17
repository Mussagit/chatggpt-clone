import { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, LogIn } from 'lucide-react';
import styles from './AuthModal.module.css';

export default function AuthModal({ onLogin }) {
  const [name, setName] = useState('Mussa Esliman');
  const [email, setEmail] = useState('mussa@example.com');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin({ name: name.trim(), email: email.trim() || 'user@example.com' });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logoBadge}>
          <Sparkles size={28} className={styles.sparkleIcon} />
        </div>

        <h1 className={styles.title}>Welcome to ChatGPT</h1>
        <p className={styles.subtitle}>
          Log in with your account to continue your conversations, access saved chats, and more.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mussa Esliman"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mussa@example.com"
            />
          </div>

          <button type="submit" className={styles.loginBtn}>
            <LogIn size={18} />
            <span>Log in as {name || 'User'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className={styles.footerNote}>
          <ShieldCheck size={14} className={styles.shieldIcon} />
          <span>Secure session powered by Google Gemini API & MySQL</span>
        </div>
      </div>
    </div>
  );
}
