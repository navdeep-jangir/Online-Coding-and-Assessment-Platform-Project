import { Fragment, type ReactNode } from 'react';
import { cn } from '@/utils/helpers';

export interface MarkdownPreviewProps {
  content: string;
  emptyText?: string;
  className?: string;
}

function renderInlineFormatting(text: string): ReactNode[] {
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="rounded bg-[#0D1117] px-1.5 py-0.5 font-mono text-xs text-[#38BDF8] border border-[#30363D]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-[#F0F6FC]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-[#F0F6FC]">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function MarkdownPreview({
  content,
  emptyText = 'Nothing to preview yet.',
  className,
}: MarkdownPreviewProps) {
  if (!content.trim()) {
    return (
      <p className={cn('text-sm italic text-[#8B949E]', className)}>{emptyText}</p>
    );
  }

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push(
        <pre
          key={`code-${i}`}
          className="overflow-x-auto rounded-lg border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs text-[#F0F6FC]"
        >
          {lang && (
            <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#8B949E]">
              {lang}
            </div>
          )}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      i += 1;
      continue;
    }

    if (/^###\s+/.test(line)) {
      blocks.push(
        <h4 key={`h3-${i}`} className="text-sm font-semibold text-[#F0F6FC]">
          {renderInlineFormatting(line.replace(/^###\s+/, ''))}
        </h4>
      );
      i += 1;
      continue;
    }

    if (/^##\s+/.test(line)) {
      blocks.push(
        <h3 key={`h2-${i}`} className="text-base font-semibold text-[#F0F6FC]">
          {renderInlineFormatting(line.replace(/^##\s+/, ''))}
        </h3>
      );
      i += 1;
      continue;
    }

    if (/^#\s+/.test(line)) {
      blocks.push(
        <h2 key={`h1-${i}`} className="text-lg font-bold text-[#F0F6FC]">
          {renderInlineFormatting(line.replace(/^#\s+/, ''))}
        </h2>
      );
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="list-disc space-y-1 pl-5 text-sm text-[#C9D1D9]">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="list-decimal space-y-1 pl-5 text-sm text-[#C9D1D9]">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i += 1;
    }

    blocks.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-[#C9D1D9]">
        {renderInlineFormatting(paragraphLines.join(' '))}
      </p>
    );
  }

  return <div className={cn('space-y-3', className)}>{blocks}</div>;
}

export default MarkdownPreview;
