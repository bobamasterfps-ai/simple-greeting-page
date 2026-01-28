import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  delay?: number;
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend = 'neutral',
  className = '',
  delay = 0
}: StatCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-foreground',
  };

  return (
    <div 
      className={`stat-card opacity-0 animate-slide-up ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="p-2 md:p-3 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
        </div>
      </div>
      
      <div>
        <p className="text-xs md:text-sm text-muted-foreground mb-1">{title}</p>
        <p className={`text-2xl md:text-3xl font-display font-bold ${trendColors[trend]}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
