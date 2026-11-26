import { isValidElement, useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';

export type StatsCardVariant =
  | 'accent'
  | 'secondary'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'default';

export interface StatsTrend {
  value: number | string;
  isPositive?: boolean;
  label?: string;
}

export interface StatsCardProps {
  icon: ReactNode | ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  trend?: string | StatsTrend;
  subtitle?: ReactNode;
  variant?: StatsCardVariant;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  children?: ReactNode;
}

interface VariantStyle {
  iconBg: string;
  iconText: string;
  borderHover: string;
  glow: string;
}

const VARIANT_STYLES: Record<StatsCardVariant, VariantStyle> = {
  accent: {
    iconBg: 'bg-[#22C55E]/15 border-[#22C55E]/30',
    iconText: 'text-[#22C55E]',
    borderHover: 'hover:border-[#22C55E]/40',
    glow: 'from-[#22C55E]/10 to-transparent',
  },
  secondary: {
    iconBg: 'bg-[#38BDF8]/15 border-[#38BDF8]/30',
    iconText: 'text-[#38BDF8]',
    borderHover: 'hover:border-[#38BDF8]/40',
    glow: 'from-[#38BDF8]/10 to-transparent',
  },
  warning: {
    iconBg: 'bg-amber-500/15 border-amber-500/30',
    iconText: 'text-amber-400',
    borderHover: 'hover:border-amber-500/40',
    glow: 'from-amber-500/10 to-transparent',
  },
  danger: {
    iconBg: 'bg-red-500/15 border-red-500/30',
    iconText: 'text-red-400',
    borderHover: 'hover:border-red-500/40',
    glow: 'from-red-500/10 to-transparent',
  },
  purple: {
    iconBg: 'bg-purple-500/15 border-purple-500/30',
    iconText: 'text-purple-400',
    borderHover: 'hover:border-purple-500/40',
    glow: 'from-purple-500/10 to-transparent',
  },
  default: {
    iconBg: 'bg-[#30363D]/60 border-[#30363D]',
    iconText: 'text-[#F0F6FC]',
    borderHover: 'hover:border-[#8B949E]/40',
    glow: 'from-[#8B949E]/5 to-transparent',
  },
};

interface ParsedNumericValue {
  hasNumber: boolean;
  target: number;
  prefix: string;
  suffix: string;
  decimals: number;
}

function parseNumericValue(
  rawValue: number | string,
  explicitPrefix = '',
  explicitSuffix = '',
  explicitDecimals?: number
): ParsedNumericValue {
  if (typeof rawValue === 'number') {
    if (!Number.isFinite(rawValue)) {
      return {
        hasNumber: false,
        target: 0,
        prefix: explicitPrefix,
        suffix: explicitSuffix,
        decimals: 0,
      };
    }
    const inferredDecimals =
      explicitDecimals !== undefined
        ? explicitDecimals
        : Number.isInteger(rawValue)
          ? 0
          : 1;
    return {
      hasNumber: true,
      target: rawValue,
      prefix: explicitPrefix,
      suffix: explicitSuffix,
      decimals: inferredDecimals,
    };
  }

  const trimmed = rawValue.trim();
  const match = trimmed.match(/^([^\d-]*)(-?[\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) {
    return {
      hasNumber: false,
      target: 0,
      prefix: explicitPrefix,
      suffix: explicitSuffix,
      decimals: 0,
    };
  }

  const numericStr = match[2].replace(/,/g, '');
  const parsed = Number(numericStr);
  if (!Number.isFinite(parsed)) {
    return {
      hasNumber: false,
      target: 0,
      prefix: explicitPrefix,
      suffix: explicitSuffix,
      decimals: 0,
    };
  }

  const decimalPart = numericStr.split('.')[1];
  const decimals =
    explicitDecimals !== undefined
      ? explicitDecimals
      : decimalPart
        ? decimalPart.length
        : 0;

  return {
    hasNumber: true,
    target: parsed,
    prefix: explicitPrefix || match[1],
    suffix: explicitSuffix || match[3],
    decimals,
  };
}

function formatAnimatedNumber(val: number, decimals: number): string {
  if (decimals > 0) {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return Math.round(val).toLocaleString();
}

export default function StatsCard({
  icon,
  label,
  value,
  trend,
  subtitle,
  variant = 'accent',
  prefix = '',
  suffix = '',
  decimals,
  className = '',
  children,
}: StatsCardProps) {
  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.accent;

  const parsed = useMemo(
    () => parseNumericValue(value, prefix, suffix, decimals),
    [value, prefix, suffix, decimals]
  );

  const motionValue = useMotionValue(0);
  const [displayNumber, setDisplayNumber] = useState<string>(() =>
    parsed.hasNumber ? formatAnimatedNumber(0, parsed.decimals) : String(value)
  );

  useEffect(() => {
    if (!parsed.hasNumber) {
      setDisplayNumber(String(value));
      return;
    }

    const controls = animate(motionValue, parsed.target, {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        setDisplayNumber(formatAnimatedNumber(latest, parsed.decimals));
      },
    });

    return () => {
      controls.stop();
    };
  }, [motionValue, parsed.hasNumber, parsed.target, parsed.decimals, value]);

  const renderedIcon = useMemo(() => {
    if (isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as ComponentType<{ className?: string }>;
    return <IconComponent className="h-5 w-5" />;
  }, [icon]);

  const normalizedTrend = useMemo(() => {
    if (trend === undefined || trend === null || trend === '') {
      return null;
    }
    if (typeof trend === 'string') {
      const trimmed = trend.trim();
      const isNegative = trimmed.startsWith('-');
      const isPositive = trimmed.startsWith('+') || !isNegative;
      return {
        text: trimmed,
        isPositive,
        label: '',
      };
    }
    const rawStr = String(trend.value);
    const inferredPositive =
      trend.isPositive !== undefined
        ? trend.isPositive
        : typeof trend.value === 'number'
          ? trend.value >= 0
          : !rawStr.trim().startsWith('-');
    const formattedTrend =
      typeof trend.value === 'number' && trend.value > 0
        ? `+${trend.value}`
        : rawStr;

    return {
      text: formattedTrend,
      isPositive: inferredPositive,
      label: trend.label ?? '',
    };
  }, [trend]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-xl border border-[#30363D] bg-[#1C2128] p-5 transition-colors duration-200 ${styles.borderHover} ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b ${styles.glow} opacity-60 transition-opacity duration-200 group-hover:opacity-100`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wider text-[#8B949E]">
            {label}
          </p>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-[#F0F6FC] sm:text-3xl">
              {parsed.hasNumber
                ? `${parsed.prefix}${displayNumber}${parsed.suffix}`
                : `${prefix}${value}${suffix}`}
            </span>
          </div>

          {subtitle ? (
            <div className="mt-1.5 text-xs text-[#8B949E]">{subtitle}</div>
          ) : null}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${styles.iconBg} ${styles.iconText}`}
        >
          {renderedIcon}
        </div>
      </div>

      {normalizedTrend ? (
        <div className="relative mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
              normalizedTrend.isPositive
                ? 'bg-[#22C55E]/15 text-[#22C55E]'
                : 'bg-red-500/15 text-red-400'
            }`}
          >
            {normalizedTrend.isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {normalizedTrend.text}
          </span>
          {normalizedTrend.label ? (
            <span className="truncate text-[#8B949E]">{normalizedTrend.label}</span>
          ) : null}
        </div>
      ) : null}

      {children ? <div className="relative mt-3">{children}</div> : null}
    </motion.div>
  );
}
