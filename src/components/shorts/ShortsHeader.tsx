import { Video, Shield, Server, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ShortsHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="font-display font-bold text-2xl md:text-3xl flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Shorts Generator
          </span>
          <Badge variant="outline" className="ml-2 text-xs hidden sm:inline-flex">
            <Sparkles className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create viral 9:16 clips from your VODs — 100% browser-based processing
        </p>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="gap-1.5 py-1">
          <Shield className="w-3 h-3 text-green-500" />
          Private & Secure
        </Badge>
        <Badge variant="secondary" className="gap-1.5 py-1">
          <Server className="w-3 h-3 text-blue-500" />
          No Server Upload
        </Badge>
      </div>
    </div>
  );
}
