import type { AiRole } from '@school-chat/shared';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIMessageContent.css';

interface AIMessageContentProps {
  content: string;
  role: AiRole;
}

/** Renders AI chat message text, parsing markdown for assistant replies. */
export function AIMessageContent({ content, role }: AIMessageContentProps) {
  if (role === 'user') {
    return <span className="ai-message-content">{content}</span>;
  }

  return (
    <div className="ai-message-content ai-message-content--markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
