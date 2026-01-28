import { Button } from '@/components/ui/button';
import { 
  ExternalLink, 
  Copy, 
  Check,
  Zap,
  BarChart3,
  TrendingUp,
  CircleCheck,
  DollarSign,
  User
} from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const socialLinks = [
  { name: 'Twitch', icon: '📺', url: 'https://www.twitch.tv/bobamasterfps' },
  { name: 'YouTube', icon: '▶️', url: 'https://www.youtube.com/@bobamasterfps' },
  { name: 'Discord', icon: '💬', url: 'https://discord.com/invite/K79u8V5FRd' },
  { name: 'Instagram', icon: '📸', url: 'https://www.instagram.com/bobamasterfps/' },
  { name: 'X (Twitter)', icon: '𝕏', url: 'https://x.com/Bobamasterfps' },
];

const features = [
  {
    icon: Zap,
    title: 'Real-time Tracking',
    description: 'Live session monitoring and stats',
  },
  {
    icon: BarChart3,
    title: 'OBS Integration',
    description: 'Custom overlay support',
  },
  {
    icon: TrendingUp,
    title: 'Analytics',
    description: 'Detailed performance insights',
  },
];

const UPI_ID = 'lazy.saifali@fam';

export function CreatorPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast({ title: 'UPI ID Copied!', description: UPI_ID });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* About the Creator */}
      <div className="text-center py-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold italic">About the Creator</h1>
        <p className="text-muted-foreground mt-2">Supporting development and future features</p>
      </div>

      {/* Connect With Us */}
      <div className="text-center">
        <h2 className="font-display font-semibold text-lg mb-4">Connect With Us</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full hover:border-primary/50 transition-all text-sm"
            >
              <span>{social.icon}</span>
              <span>{social.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="text-center">
        <h2 className="font-display font-semibold text-lg mb-6">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="glass rounded-xl p-6 text-left">
                <Icon className="w-6 h-6 text-muted-foreground mb-3" />
                <h3 className="font-display font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Testimonials */}
      <div className="text-center">
        <h2 className="font-display font-semibold text-lg mb-4">Testimonials</h2>
        <div className="glass rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm italic">"This tracker has completely changed how I analyze my gameplay. Highly recommended!"</p>
              <p className="text-xs text-primary mt-2">- Pro Player</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Development */}
      <div className="text-center">
        <h2 className="font-display font-semibold text-lg mb-6">Support Development</h2>
        
        <div className="glass rounded-xl p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">Premium Access</p>
            <p className="text-xs text-success">Unlock all features and support future development</p>
          </div>

          {/* Premium Card */}
          <div className="glass rounded-xl p-6 max-w-sm mx-auto border border-success/30">
            <h3 className="font-display font-bold text-lg">Premium</h3>
            <div className="text-3xl font-display font-bold my-2">₹50</div>
            <p className="text-xs text-muted-foreground mb-4">One-time payment</p>
            
            <div className="space-y-2 text-left text-sm mb-6">
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-success" />
                <span>Advanced analytics & insights</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-success" />
                <span>Custom overlay themes</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-success" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 text-success" />
                <span>Lifetime updates</span>
              </div>
            </div>
            
            <Button className="w-full bg-success hover:bg-success/90 text-background">
              <DollarSign className="w-4 h-4 mr-2" />
              Get Premium Access
            </Button>
          </div>

          {/* UPI Support */}
          <div className="mt-6 space-y-3 max-w-sm mx-auto">
            <p className="text-sm text-muted-foreground">Or support via UPI</p>
            <div className="glass rounded-lg px-4 py-2 text-sm text-primary font-mono">
              {UPI_ID}
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleCopyUPI}
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy UPI ID
            </Button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="text-center">
        <h2 className="font-display font-semibold text-lg mb-4">FAQ</h2>
        <div className="space-y-3 text-left">
          <div className="glass rounded-xl p-4">
            <h4 className="font-semibold text-sm">How do I get started?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Simply add your Riot ID and API key in the configuration section to begin tracking.
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <h4 className="font-semibold text-sm">Is my data secure?</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Yes, all data is encrypted and stored securely. We never share your information.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-border/30">
        <p className="text-xs text-muted-foreground">© 2024 Valorant Tracker. All rights reserved.</p>
      </div>
    </div>
  );
}
