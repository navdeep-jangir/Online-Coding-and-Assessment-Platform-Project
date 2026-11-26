import React from 'react';

interface MarkdownRendererProps {
  content: string | string[];
  className?: string;
}

/**
 * Renders safe inline Markdown tokens (**bold**, *italic*, `code`, [link](url))
 * into React nodes without using dangerouslySetInnerHTML.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\((https?:\/\/[^)]+|\/[^)]+)\))/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    const token = match[0];
    const k = `${keyPrefix}-${part++}`;

    if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={k}
          className="rounded border border-[#30363D] bg-[#0D1117] px-1.5 py-0.5 font-mono text-[0.85em] text-[#38BDF8]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={k} className="font-semibold text-[#F0F6FC]">
          {renderInline(token.slice(2, -2), `${k}-b`)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      nodes.push(
        <em key={k} className="italic text-[#F0F6FC]/95">
          {renderInline(token.slice(1, -1), `${k}-i`)}
        </em>
      );
    } else if (token.startsWith('[')) {
      const closeBracket = token.indexOf('](');
      const label = token.slice(1, closeBracket);
      const url = token.slice(closeBracket + 2, -1);
      nodes.push(
        <a
          key={k}
          href={url}
          target={url.startsWith('http') ? '_blank' : undefined}
          rel={url.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-[#38BDF8] underline decoration-[#38BDF8]/40 underline-offset-2 hover:text-[#7DD3FC]"
        >
          {label}
        </a>
      );
    }
    lastIdx = match.index + token.length;
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }
  return nodes;
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  return /^\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?$/.test(trimmed);
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/**
 * Safe, zero-dependency React Markdown renderer supporting headings, bold, italic,
 * inline code, fenced code blocks, ordered/unordered lists, and GFM tables.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const normalized = Array.isArray(content) ? content.join('\n') : content;
  if (!normalized) return null;

  const lines = normalized.replace(/\r\n/g, '\n').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push(
        <pre
          key={`b-${blockKey++}`}
          className="my-2 overflow-x-auto rounded-xl border border-[#30363D] bg-[#0D1117] p-3 font-mono text-xs leading-relaxed text-[#38BDF8]"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Markdown table
    if (trimmed.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim() !== '') {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      const tk = `b-${blockKey++}`;
      blocks.push(
        <div key={tk} className="my-2 overflow-x-auto rounded-lg border border-[#30363D]">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="bg-[#0D1117] text-[#F0F6FC]">
              <tr>
                {headers.map((h, hi) => (
                  <th key={`${tk}-h-${hi}`} className="border-b border-[#30363D] px-3 py-2 font-semibold">
                    {renderInline(h, `${tk}-hi-${hi}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363D]/60">
              {rows.map((r, ri) => (
                <tr key={`${tk}-r-${ri}`} className="bg-[#161B22]/60">
                  {headers.map((_, ci) => (
                    <td key={`${tk}-c-${ri}-${ci}`} className="px-3 py-2 text-[#F0F6FC]/90">
                      {renderInline(r[ci] ?? '', `${tk}-ci-${ri}-${ci}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const hk = `b-${blockKey++}`;
      const sizeClass = level === 1 ? 'text-base font-bold' : level === 2 ? 'text-sm font-bold' : 'text-sm font-semibold';
      blocks.push(
        <div key={hk} className={`mt-2 ${sizeClass} text-[#F0F6FC]`}>
          {renderInline(text, hk)}
        </div>
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      const lk = `b-${blockKey++}`;
      blocks.push(
        <ul key={lk} className="my-1.5 list-disc space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={`${lk}-${idx}`} className="leading-relaxed">
              {renderInline(item, `${lk}-i-${idx}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      const ok = `b-${blockKey++}`;
      blocks.push(
        <ol key={ok} className="my-1.5 list-decimal space-y-1 pl-5">
          {items.map((item, idx) => (
            <li key={`${ok}-${idx}`} className="leading-relaxed">
              {renderInline(item, `${ok}-i-${idx}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph (collect contiguous non-empty lines that aren't special blocks)
    const paraLines: string[] = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !/^#{1,3}\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !(lines[i].trim().includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1]))
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    const pk = `b-${blockKey++}`;
    blocks.push(
      <p key={pk} className="leading-relaxed">
        {paraLines.map((pl, pi) => (
          <React.Fragment key={`${pk}-l-${pi}`}>
            {pi > 0 && <br />}
            {renderInline(pl, `${pk}-${pi}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className={`space-y-2 ${className}`}>{blocks}</div>;
};

export default MarkdownRenderer;
