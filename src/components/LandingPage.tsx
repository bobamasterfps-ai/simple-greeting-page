import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, ChevronRight, Sparkles, Target, BarChart3 } from 'lucide-react';
import { overlayThemes } from '@/lib/overlayThemes';

interface LandingPageProps {
  onLaunch: () => void;
}

export function LandingPage({ onLaunch }: LandingPageProps) {
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

  // Rotate through themes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentThemeIndex((prev) => (prev + 1) % overlayThemes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentTheme = overlayThemes[currentThemeIndex];

  const features = [
    { icon: Target, title: 'Real-Time Tracking', desc: 'Live RR updates as you play' },
    { icon: Sparkles, title: `${overlayThemes.length} Premium Themes`, desc: 'Customizable overlay styles' },
    { icon: BarChart3, title: 'Session Analytics', desc: 'Visualize your performance' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        {/* Logo */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-float">
              <Zap className="w-9 h-9 text-background" />
            </div>
            <div>
              <h1 className="font-display font-black text-5xl tracking-wider text-gradient">
                SPIKES
              </h1>
              <p className="text-lg tracking-[0.4em] text-muted-foreground font-light">
                OVERLAY
              </p>
            </div>
          </div>
        </div>

        {/* Theme Preview */}
        <div className="my-12 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="glass rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />
            <div className="relative">
              <div className="text-center mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Theme Preview
                </p>
                <p className="font-display font-semibold text-primary animate-pulse">
                  {currentTheme.name}
                </p>
              </div>
              
              {/* Mock overlay preview */}
              <div 
                className="mx-auto rounded-xl overflow-hidden transition-all duration-500"
                style={{ 
                  width: Math.min(currentTheme.width * 0.8, 400),
                  height: Math.min(currentTheme.height * 0.8, 160),
                }}
              >
                <div className="w-full h-full bg-card/60 backdrop-blur-xl border border-border/50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                      <span className="font-display font-bold text-primary">67</span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-sm">Diamond 2</p>
                      <p className="text-xs text-muted-foreground">Session: 3W - 1L</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-success text-lg">+45</p>
                    <p className="text-xs text-muted-foreground">Net RR</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl animate-fade-in" style={{ animationDelay: '400ms' }}>
          {features.map((feature, i) => (
            <div 
              key={feature.title}
              className="glass rounded-xl p-4 text-center hover:scale-105 transition-transform"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <feature.icon className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-display font-semibold text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button 
          size="lg" 
          onClick={onLaunch}
          className="glow-primary font-display text-lg px-8 py-6 animate-fade-in"
          style={{ animationDelay: '600ms' }}
        >
          Launch Dashboard
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-8 animate-fade-in" style={{ animationDelay: '800ms' }}>
          Premium Valorant Rank Tracking for Streamers
        </p>
      </div>
    </div>
  );
}
