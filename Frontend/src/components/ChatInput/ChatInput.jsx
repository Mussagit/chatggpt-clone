import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Brain,
  Mic,
  AudioLines,
  ArrowUp,
  Loader2,
  Paperclip,
  BookOpen,
  Image as ImageIcon,
  PenTool,
  Globe,
  Compass,
  BarChart3,
  KeyRound,
  GitBranch,
  Search,
  X,
  FileText,
} from 'lucide-react';
import styles from './ChatInput.module.css';

const TOOL_OPTIONS = [
  {
    id: 'upload',
    icon: <Paperclip size={18} className={styles.toolIconUpload} />,
    title: 'Add photos & PDFs',
    subtitle: 'Upload images or PDF documents',
    type: 'upload',
  },
  {
    id: 'photo',
    icon: <ImageIcon size={18} className={styles.toolIconImage} />,
    title: 'Insert Photo',
    subtitle: 'Upload JPEG, PNG, WEBP images',
    type: 'photo',
  },
  {
    id: 'pdf',
    icon: <FileText size={18} className={styles.toolIconPdf} />,
    title: 'Insert PDF',
    subtitle: 'Upload and analyze PDF documents',
    type: 'pdf',
  },
  {
    id: 'library',
    icon: <BookOpen size={18} className={styles.toolIconLibrary} />,
    title: 'Add from library',
    subtitle: 'Browse and search your files',
    type: 'badge',
    badgeText: 'Library',
  },
  {
    id: 'websearch',
    icon: <Globe size={18} className={styles.toolIconWeb} />,
    title: 'Web search',
    subtitle: 'Find real-time news and info',
    type: 'badge',
    badgeText: 'Web Search',
  },
  {
    id: 'research',
    icon: <Compass size={18} className={styles.toolIconResearch} />,
    title: 'Deep research',
    subtitle: 'Get a detailed report',
    type: 'badge',
    badgeText: 'Deep Research',
  },
  {
    id: 'sketch',
    icon: <PenTool size={18} className={styles.toolIconSketch} />,
    title: 'Sketch',
    subtitle: 'Draw and attach an image',
    type: 'badge',
    badgeText: 'Sketch',
  },
  {
    id: 'visualize',
    icon: <BarChart3 size={18} className={styles.toolIconViz} />,
    title: 'Visualize',
    subtitle: 'Create visualizations and interactive tools',
    type: 'badge',
    badgeText: 'Visualize',
  },
  {
    id: 'platform',
    icon: <KeyRound size={18} className={styles.toolIconPlatform} />,
    title: 'OpenAI Platform',
    subtitle: 'Manage API keys and view billing and usage.',
    type: 'badge',
    badgeText: 'Platform API',
  },
  {
    id: 'github',
    icon: <GitBranch size={18} className={styles.toolIconGithub} />,
    title: 'GitHub',
    subtitle: 'Triage PRs, issues, CI, and publish flows',
    hasConnect: true,
    type: 'badge',
    badgeText: 'GitHub',
  },
];

export default function ChatInput({ handleSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const [isThinkMode, setIsThinkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  const [activeTool, setActiveTool] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Close tools popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Handle file reader and conversion to base64
  const processFiles = (filesList) => {
    const files = Array.from(filesList);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        const isImg = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'image/png'),
            data: base64Data,
            size: (file.size / 1024).toFixed(1) + ' KB',
            isImage: isImg,
            isPdf: isPdf,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    setIsMenuOpen(false);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const handleSelectTool = (tool) => {
    if (tool.id === 'upload') {
      if (fileInputRef.current) {
        fileInputRef.current.accept = 'image/*,application/pdf';
        fileInputRef.current.click();
      }
      return;
    }
    if (tool.id === 'photo') {
      if (fileInputRef.current) {
        fileInputRef.current.accept = 'image/*';
        fileInputRef.current.click();
      }
      return;
    }
    if (tool.id === 'pdf') {
      if (fileInputRef.current) {
        fileInputRef.current.accept = 'application/pdf';
        fileInputRef.current.click();
      }
      return;
    }
    setActiveTool(tool);
    setIsMenuOpen(false);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    let fullPrompt = input.trim();
    if (activeTool) {
      fullPrompt = `[${activeTool.badgeText}] ${fullPrompt}`;
    }

    handleSendMessage(fullPrompt, attachedFiles, isThinkMode);
    setInput('');
    setActiveTool(null);
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const filteredTools = TOOL_OPTIONS.filter((t) =>
    t.title.toLowerCase().includes(toolSearch.toLowerCase()) ||
    t.subtitle.toLowerCase().includes(toolSearch.toLowerCase())
  );

  return (
    <div className={styles.container}>
      {/* Hidden File Input for Photos and PDFs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className={styles.hiddenFileInput}
        accept="image/*,application/pdf"
        multiple
      />

      {/* Attachments & Tools Popover */}
      {isMenuOpen && (
        <div className={styles.toolsPopover} ref={menuRef}>
          <div className={styles.toolsList}>
            {filteredTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className={styles.toolItem}
                onClick={() => handleSelectTool(tool)}
              >
                <div className={styles.toolIconWrapper}>{tool.icon}</div>
                <div className={styles.toolText}>
                  <span className={styles.toolTitle}>{tool.title}</span>
                  <span className={styles.toolSubtitle}>{tool.subtitle}</span>
                </div>
                {tool.hasConnect && (
                  <span className={styles.connectBadge}>Connect</span>
                )}
              </button>
            ))}
          </div>

          {/* Search box at bottom */}
          <div className={styles.toolsSearchWrapper}>
            <Search size={14} className={styles.toolsSearchIcon} />
            <input
              type="text"
              className={styles.toolsSearchInput}
              placeholder="Type to search plugins, files, folders & skills"
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Active Tool Badge & Attached Photos/PDFs Previews */}
        {(activeTool || attachedFiles.length > 0) && (
          <div className={styles.chipsContainer}>
            {activeTool && (
              <div className={styles.activeToolChip}>
                <span>{activeTool.badgeText}</span>
                <button
                  type="button"
                  onClick={() => setActiveTool(null)}
                  className={styles.removeChipBtn}
                >
                  <X size={12} />
                </button>
              </div>
            )}
            {attachedFiles.map((file, idx) => (
              <div key={idx} className={file.isImage ? styles.imagePreviewChip : styles.fileChip}>
                {file.isImage ? (
                  <img src={file.data} alt={file.name} className={styles.chipThumbnail} />
                ) : (
                  <div className={styles.pdfChipBadge}>
                    <FileText size={12} />
                    <span>PDF</span>
                  </div>
                )}
                <span className={styles.fileName}>{file.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className={styles.removeChipBtn}
                  title="Remove file"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputRow}>
          {/* Left Plus Attachment Button */}
          <button
            type="button"
            className={`${styles.leftPlusBtn} ${isMenuOpen ? styles.plusActive : ''}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="Attach Photos, PDFs, and Tools"
            aria-label="Add content"
          >
            <Plus size={18} />
          </button>

          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            className={styles.textarea}
            placeholder="Ask anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />

          {/* Right Action Tools */}
          <div className={styles.rightActions}>
            {/* Think Mode Toggle Button */}
            <button
              type="button"
              className={`${styles.thinkBtn} ${isThinkMode ? styles.thinkActive : ''}`}
              onClick={() => setIsThinkMode((prev) => !prev)}
              title={isThinkMode ? 'Thinking Mode: Active' : 'Enable Think Mode'}
            >
              <Brain size={16} className={styles.brainIcon} />
              <span>Think</span>
            </button>

            {/* Microphone */}
            <button
              type="button"
              className={styles.iconActionBtn}
              title="Voice input"
              aria-label="Microphone"
            >
              <Mic size={18} />
            </button>

            {/* Submit Arrow or Blue Voice button */}
            {input.trim() || attachedFiles.length > 0 ? (
              <button
                type="submit"
                className={styles.submitArrowBtn}
                disabled={isLoading}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 size={16} className={styles.spin} />
                ) : (
                  <ArrowUp size={16} />
                )}
              </button>
            ) : (
              <button
                type="button"
                className={styles.blueVoiceBtn}
                title="Voice mode"
                aria-label="Voice mode"
              >
                <AudioLines size={18} />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
