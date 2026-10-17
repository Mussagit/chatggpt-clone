import { useState } from 'react';
import { User, Bot, Copy, Check, FileText, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import styles from './ChatMessage.module.css';

function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLanguage}>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className={styles.copyBtn}
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={14} className={styles.successIcon} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '16px',
          backgroundColor: '#0d0d0d',
          fontSize: '13.5px',
          lineHeight: '1.6',
          borderRadius: '0 0 8px 8px',
        }}
        wrapLongLines={true}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export default function ChatMessage({ role, content, files = [] }) {
  const [messageCopied, setMessageCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className={`${styles.message} ${styles[role]}`}>
      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div className={styles.lightbox} onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className={styles.lightboxImg} />
        </div>
      )}

      <div className={`${styles.avatar} ${styles[role]}`}>
        {role === 'user' ? (
          <User size={18} color="white" />
        ) : (
          <Bot size={18} color="white" />
        )}
      </div>

      <div className={styles.contentWrapper}>
        {/* Render Attached Files (Photos and PDFs) */}
        {files && files.length > 0 && (
          <div className={styles.attachedFilesGrid}>
            {files.map((file, idx) => {
              const isImage = file.mimeType?.startsWith('image/') || file.data?.startsWith('data:image/');
              const isPdf = file.mimeType === 'application/pdf' || file.name?.endsWith('.pdf');

              if (isImage && file.data) {
                return (
                  <div
                    key={idx}
                    className={styles.imageAttachmentCard}
                    onClick={() => setPreviewImage(file.data)}
                    title="Click to view full image"
                  >
                    <img src={file.data} alt={file.name || 'Uploaded photo'} className={styles.attachedImage} />
                    <span className={styles.imageCaption}>{file.name}</span>
                  </div>
                );
              }

              return (
                <div key={idx} className={styles.pdfAttachmentCard}>
                  <div className={styles.pdfIconBadge}>
                    <FileText size={20} className={styles.pdfIcon} />
                    <span className={styles.pdfTag}>{isPdf ? 'PDF' : 'DOC'}</span>
                  </div>
                  <div className={styles.pdfDetails}>
                    <span className={styles.pdfName}>{file.name}</span>
                    <span className={styles.pdfSize}>{file.size || 'Document'}</span>
                  </div>
                  {file.data && (
                    <a
                      href={file.data}
                      download={file.name || 'document.pdf'}
                      className={styles.pdfDownloadBtn}
                      title="Download PDF"
                    >
                      <Download size={15} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Text / Markdown Content */}
        {content && (
          <div className={styles.content}>
            {role === 'user' ? (
              content
            ) : (
              <div className={styles.markdownBody}>
                <ReactMarkdown
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      if (!inline && match) {
                        return (
                          <CodeBlock
                            language={match[1]}
                            value={codeString}
                          />
                        );
                      }
                      if (!inline && codeString.includes('\n')) {
                        return (
                          <CodeBlock
                            language="text"
                            value={codeString}
                          />
                        );
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {role === 'assistant' && (
          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={handleCopyMessage}
              title="Copy response"
            >
              {messageCopied ? (
                <>
                  <Check size={14} className={styles.successIcon} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
