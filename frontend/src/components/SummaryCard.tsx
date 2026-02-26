import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  accentColor?: 'amber' | 'blue' | 'green' | 'purple';
}

const colorMap = {
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    border: 'border-amber-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  green: {
    bg: 'bg-green-500/10',
    icon: 'text-green-400',
    border: 'border-green-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-400',
    border: 'border-purple-500/20',
  },
};

export default function SummaryCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  accentColor = 'amber',
}: SummaryCardProps) {
  const colors = colorMap[accentColor];

  return (
    <div
      className={cn(
        'bg-card rounded-xl p-5 border shadow-card hover:shadow-card-hover transition-shadow',
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-display font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-xs mt-1 font-medium',
                trendUp ? 'text-green-400' : 'text-muted-foreground'
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colors.bg)}>
          <Icon size={22} className={colors.icon} />
        </div>
      </div>
    </div>
  );
}
