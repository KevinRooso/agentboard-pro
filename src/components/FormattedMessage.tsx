import React from 'react';

interface FormattedMessageProps {
  content: string;
}

export function FormattedMessage({ content }: FormattedMessageProps) {
  // Convert markdown-like formatting to JSX
  const formatText = (text: string) => {
    // Split by lines for processing
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim() === '') {
        elements.push(<br key={`br-${index}`} />);
        return;
      }

      // Check for headings
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="font-semibold text-sm mt-3 mb-2 break-words">
            {line.substring(4)}
          </h4>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h3 key={index} className="font-semibold text-base mt-4 mb-2 break-words">
            {line.substring(3)}
          </h3>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h2 key={index} className="font-bold text-lg mt-4 mb-3 break-words">
            {line.substring(2)}
          </h2>
        );
      } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
        // Full line bold
        elements.push(
          <p key={index} className="font-semibold my-2 break-words">
            {line.slice(2, -2)}
          </p>
        );
      } else if (line.match(/^\d+\.\s/)) {
        // Numbered list
        elements.push(
          <div key={index} className="ml-4 my-1 break-words">
            {formatInlineText(line)}
          </div>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet list
        elements.push(
          <div key={index} className="ml-4 my-1 flex break-words">
            <span className="mr-2 flex-shrink-0">•</span>
            <span className="break-words">{formatInlineText(line.substring(2))}</span>
          </div>
        );
      } else if (line.startsWith('> ')) {
        // Quote
        elements.push(
          <div key={index} className="border-l-2 border-muted-foreground pl-3 my-2 italic text-muted-foreground break-words">
            {formatInlineText(line.substring(2))}
          </div>
        );
      } else {
        // Regular paragraph
        elements.push(
          <p key={index} className="my-2 break-words">
            {formatInlineText(line)}
          </p>
        );
      }
    });

    return elements;
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Handle inline formatting
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;

    // Bold text **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }
      
      // Add bold text
      parts.push(
        <strong key={`bold-${match.index}`}>
          {match[1]}
        </strong>
      );
      
      currentIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    // If no formatting was found, return the original text
    return parts.length > 1 ? parts : text;
  };

  return <div className="formatted-message break-words overflow-wrap-anywhere">{formatText(content)}</div>;
}
