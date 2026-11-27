import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const now = new Date().getTime();
    const target = new Date(dateString).getTime();
    const diffHours = Math.round((target - now) / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      const absH = Math.abs(diffHours);
      if (absH > 24) return `${Math.floor(absH / 24)}d ago`;
      return `${absH}h ago`;
    }
    if (diffHours > 24) return `in ${Math.floor(diffHours / 24)} days`;
    return `in ${diffHours} hours`;
  } catch {
    return dateString;
  }
}
