import React from 'react';
import { cn } from '../../lib/utils'; // Adjust path as needed

export type BadgeVariant = 'default' | 'outline' | 'soft' | 'dot';
export type BadgeColor = 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  dot?: boolean; // Convenience for dot variant
}

const colorStyles: Record<BadgeColor, { soft: string; dot: string; border: string }> = {
  slate:   { soft: 'bg-slate-100 text-slate-700',   dot: 'bg-slate-500',   border: 'border-slate-200 text-slate-700' },
  gray:    { soft: 'bg-gray-100 text-gray-700',     dot: 'bg-gray-500',    border: 'border-gray-200 text-gray-700' },
  zinc:    { soft: 'bg-zinc-100 text-zinc-700',     dot: 'bg-zinc-500',    border: 'border-zinc-200 text-zinc-700' },
  neutral: { soft: 'bg-neutral-100 text-neutral-700', dot: 'bg-neutral-500', border: 'border-neutral-200 text-neutral-700' },
  stone:   { soft: 'bg-stone-100 text-stone-700',    dot: 'bg-stone-500',   border: 'border-stone-200 text-stone-700' },
  red:     { soft: 'bg-red-100 text-red-700',       dot: 'bg-red-500',     border: 'border-red-200 text-red-700' },
  orange:  { soft: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500',  border: 'border-orange-200 text-orange-800' },
  amber:   { soft: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-500',   border: 'border-amber-200 text-amber-800' },
  yellow:  { soft: 'bg-yellow-100 text-yellow-800',  dot: 'bg-yellow-500',  border: 'border-yellow-200 text-yellow-800' },
  lime:    { soft: 'bg-lime-100 text-lime-800',     dot: 'bg-lime-500',    border: 'border-lime-200 text-lime-800' },
  green:   { soft: 'bg-green-100 text-green-700',   dot: 'bg-green-500',   border: 'border-green-200 text-green-700' },
  emerald: { soft: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200 text-emerald-700' },
  teal:    { soft: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500',    border: 'border-teal-200 text-teal-700' },
  cyan:    { soft: 'bg-cyan-100 text-cyan-800',     dot: 'bg-cyan-500',    border: 'border-cyan-200 text-cyan-800' },
  sky:     { soft: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-500',     border: 'border-sky-200 text-sky-700' },
  blue:    { soft: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',    border: 'border-blue-200 text-blue-700' },
  indigo:  { soft: 'bg-indigo-100 text-indigo-700',  dot: 'bg-indigo-500',  border: 'border-indigo-200 text-indigo-700' },
  violet:  { soft: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500',  border: 'border-violet-200 text-violet-700' },
  purple:  { soft: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-500',  border: 'border-purple-200 text-purple-700' },
  fuchsia: { soft: 'bg-fuchsia-100 text-fuchsia-700', dot: 'bg-fuchsia-500', border: 'border-fuchsia-200 text-fuchsia-700' },
  pink:    { soft: 'bg-pink-100 text-pink-700',     dot: 'bg-pink-500',    border: 'border-pink-200 text-pink-700' },
  rose:    { soft: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500',    border: 'border-rose-200 text-rose-700' },
};

export function Badge({ 
  className, 
  variant = 'soft', 
  color = 'zinc', 
  dot, 
  children,
  ...props 
}: BadgeProps) {
  
  const styles = colorStyles[color];
  const isDot = variant === 'dot' || dot;
  
  return (
    <div className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tabular-nums tracking-wide hover:opacity-100",
      // Soft Variant (Default for Status)
      !isDot && variant === 'soft' && styles.soft,
      // Outline Variant
      variant === 'outline' && `border ${styles.border} bg-transparent`,
      // Dot Variant
      isDot && `pl-2 pr-2.5 py-0.5 gap-1.5 ${styles.soft}`,
      className
    )} {...props}>
      {isDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      )}
      {children}
    </div>
  );
}
