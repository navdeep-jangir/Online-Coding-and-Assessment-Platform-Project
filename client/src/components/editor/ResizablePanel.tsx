import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { GripHorizontal, GripVertical } from 'lucide-react';
import { cn } from '@/utils/helpers';

export interface ResizablePanelProps {
  direction?: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  firstPanel: ReactNode;
  secondPanel: ReactNode;
  storageKey?: string;
  stackOnMobile?: boolean;
  onResize?: (sizePercent: number) => void;
  className?: string;
  firstPanelClassName?: string;
  secondPanelClassName?: string;
  handleClassName?: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readStoredSize(
  storageKey: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (!storageKey) return clamp(fallback, min, max);
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return clamp(fallback, min, max);
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? clamp(parsed, min, max) : clamp(fallback, min, max);
  } catch {
    return clamp(fallback, min, max);
  }
}

export function ResizablePanel({
  direction = 'horizontal',
  initialSize = 50,
  minSize = 20,
  maxSize = 80,
  firstPanel,
  secondPanel,
  storageKey,
  stackOnMobile = true,
  onResize,
  className,
  firstPanelClassName,
  secondPanelClassName,
  handleClassName,
}: ResizablePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number>(() =>
    readStoredSize(storageKey, initialSize, minSize, maxSize)
  );
  const [isDragging, setIsDragging] = useState(false);

  const isHorizontal = direction === 'horizontal';

  const updateSize = useCallback(
    (nextSize: number) => {
      const clamped = clamp(nextSize, minSize, maxSize);
      setSize(clamped);
      onResize?.(clamped);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, clamped.toFixed(2));
        } catch {
          // Ignore storage write errors
        }
      }
    },
    [maxSize, minSize, onResize, storageKey]
  );

  const calculatePercentFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (isHorizontal) {
        if (rect.width <= 0) return;
        const next = ((clientX - rect.left) / rect.width) * 100;
        updateSize(next);
      } else {
        if (rect.height <= 0) return;
        const next = ((clientY - rect.top) / rect.height) * 100;
        updateSize(next);
      }
    },
    [isHorizontal, updateSize]
  );

  useEffect(() => {
    if (!isDragging) return;

    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    const handlePointerMove = (event: PointerEvent) => {
      calculatePercentFromPoint(event.clientX, event.clientY);
    };

    const handleMouseMove = (event: MouseEvent) => {
      calculatePercentFromPoint(event.clientX, event.clientY);
    };

    const stopDragging = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    window.addEventListener('mouseup', stopDragging);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [calculatePercentFromPoint, isDragging, isHorizontal]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 5 : 2;
    if (isHorizontal) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        updateSize(size - step);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        updateSize(size + step);
      }
    } else {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        updateSize(size - step);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        updateSize(size + step);
      }
    }
    if (event.key === 'Home') {
      event.preventDefault();
      updateSize(initialSize);
    }
  };

  const panelSizeStyle = {
    '--panel-size': `${size}%`,
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      style={panelSizeStyle}
      className={cn(
        'relative flex w-full min-w-0',
        isHorizontal
          ? stackOnMobile
            ? 'min-h-full flex-col lg:h-full lg:min-h-0 lg:flex-row'
            : 'h-full min-h-0 flex-row'
          : 'h-full min-h-0 flex-col',
        className
      )}
    >
      {/* Prevent Monaco or embedded views from swallowing pointer events mid-drag */}
      {isDragging && (
        <div
          className={cn(
            'fixed inset-0 z-50',
            isHorizontal ? 'cursor-col-resize' : 'cursor-row-resize'
          )}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'min-w-0 overflow-hidden',
          isHorizontal
            ? stackOnMobile
              ? 'min-h-[360px] w-full lg:h-full lg:min-h-0 lg:w-[var(--panel-size)] lg:shrink-0'
              : 'h-full min-h-0 w-[var(--panel-size)] shrink-0'
            : 'min-h-0 w-full h-[var(--panel-size)] shrink-0',
          firstPanelClassName
        )}
      >
        {firstPanel}
      </div>

      <div
        role="separator"
        tabIndex={0}
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-label={isHorizontal ? 'Resize panels horizontally' : 'Resize panels vertically'}
        aria-valuenow={Math.round(size)}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        title="Drag to resize (double-click to reset)"
        onPointerDown={handlePointerDown}
        onDoubleClick={() => updateSize(initialSize)}
        onKeyDown={handleKeyDown}
        className={cn(
          'group relative z-20 flex shrink-0 items-center justify-center bg-[#0D1117] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E]',
          isHorizontal
            ? stackOnMobile
              ? 'hidden lg:flex lg:w-2 lg:cursor-col-resize'
              : 'w-2 cursor-col-resize'
            : 'h-2 w-full cursor-row-resize',
          handleClassName
        )}
      >
        <div
          className={cn(
            'transition-colors',
            isHorizontal ? 'h-full w-px' : 'h-px w-full',
            isDragging
              ? 'bg-[#22C55E]'
              : 'bg-[#30363D] group-hover:bg-[#22C55E]/70'
          )}
        />
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full border bg-[#161B22] text-[#8B949E] transition-colors',
            isHorizontal ? 'h-7 w-3.5' : 'h-3.5 w-7',
            isDragging
              ? 'border-[#22C55E] text-[#22C55E]'
              : 'border-[#30363D] group-hover:border-[#22C55E]/70 group-hover:text-[#F0F6FC]'
          )}
        >
          {isHorizontal ? (
            <GripVertical className="h-3 w-3" aria-hidden="true" />
          ) : (
            <GripHorizontal className="h-3 w-3" aria-hidden="true" />
          )}
        </span>
      </div>

      <div
        className={cn(
          'min-w-0 flex-1 overflow-hidden',
          isHorizontal && stackOnMobile
            ? 'h-[520px] min-h-[520px] lg:h-full lg:min-h-0'
            : 'min-h-0',
          secondPanelClassName
        )}
      >
        {secondPanel}
      </div>
    </div>
  );
}

export default ResizablePanel;
