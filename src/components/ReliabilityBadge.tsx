/**
 * Reliability Badge - Shows strategy trustworthiness
 * Based on win rate, usage count, and rank consistency
 */
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, AlertTriangle, CheckCircle, Sparkles, HelpCircle } from 'lucide-react';

interface ReliabilityBadgeProps {
  winRate: number;
  totalUses: number;
  className?: string;
}

type ReliabilityLevel = 'experimental' | 'risky' | 'situational' | 'reliable' | 'tournament';

interface ReliabilityInfo {
  level: ReliabilityLevel;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function calculateReliability(winRate: number, totalUses: number): ReliabilityInfo {
  // Not enough data
  if (totalUses < 3) {
    return {
      level: 'experimental',
      label: 'Experimental',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      icon: HelpCircle,
      description: 'Not enough data yet. Use this strategy more to build reliability.',
    };
  }

  // Calculate score with usage bonus
  let score = winRate;
  
  // Bonus for high usage (more confident in the data)
  if (totalUses >= 10) score *= 1.05;
  if (totalUses >= 20) score *= 1.05;
  
  // Penalty for low usage
  if (totalUses < 5) score *= 0.9;

  // Cap at 99
  score = Math.min(Math.round(score), 99);

  if (score < 40) {
    return {
      level: 'risky',
      label: 'Risky',
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: AlertTriangle,
      description: `${score}% success rate. Consider revising this strategy.`,
    };
  }

  if (score < 55) {
    return {
      level: 'situational',
      label: 'Situational',
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      icon: Shield,
      description: `${score}% success rate. Works in specific situations.`,
    };
  }

  if (score < 75) {
    return {
      level: 'reliable',
      label: 'Reliable',
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      icon: CheckCircle,
      description: `${score}% success rate. Solid strategy for ranked play.`,
    };
  }

  return {
    level: 'tournament',
    label: 'Tournament Ready',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: Sparkles,
    description: `${score}% success rate. Proven to work at high level.`,
  };
}

export function ReliabilityBadge({ winRate, totalUses, className = '' }: ReliabilityBadgeProps) {
  const info = calculateReliability(winRate, totalUses);
  const Icon = info.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`gap-1 cursor-help ${info.color} ${className}`}
          >
            <Icon className="w-3 h-3" />
            {info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium">{info.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {info.description}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {totalUses} uses
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Calculate reliability score for display
 */
export function getReliabilityScore(winRate: number, totalUses: number): number {
  if (totalUses < 3) return 0;
  
  let score = winRate;
  if (totalUses >= 10) score *= 1.05;
  if (totalUses >= 20) score *= 1.05;
  if (totalUses < 5) score *= 0.9;
  
  return Math.min(Math.round(score), 99);
}
