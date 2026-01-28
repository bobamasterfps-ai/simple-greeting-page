import { useOverlay } from '@/context/OverlayContext';
import { OverlayPreview } from '@/components/OverlayPreview';
import { overlayThemes } from '@/lib/overlayThemes';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export function OverlayPage() {
  const { 
    settings, 
    updateSettings, 
    config, 
    mmrData, 
    dailyStats, 
    transparencies, 
    updateTransparency 
  } = useOverlay();
  const [copied, setCopied] = useState(false);

  const getOBSUrl = () => {
    // Use pure HTML overlay file for OBS stability - no React, no routing issues
    const baseUrl = window.location.origin + '/overlay.html';
    const isTransparent = transparencies[settings.theme] ?? true;
    const params = new URLSearchParams({
      theme: settings.theme,
      name: config.username || '',
      tag: config.tag || '',
      region: config.region || 'ap',
      transparent: isTransparent ? 'true' : 'false',
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getOBSUrl());
    setCopied(true);
    toast({ title: 'OBS URL copied!', description: 'Paste this in OBS Browser Source' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenOverlay = () => {
    window.open(getOBSUrl(), '_blank');
  };

  // Preview data - uses DAILY stats (today only)
  const previewData = {
    rank: mmrData?.tierName || 'Diamond 3',
    rr: mmrData?.rr || 68,
    tierId: mmrData?.tierId || 18,
    wins: dailyStats.wins || 8,
    losses: dailyStats.losses || 4,
    lastChange: mmrData?.lastChange || 23,
    netRR: dailyStats.netRR || 47,
    username: config.username || 'Player',
    tag: config.tag || '0001',
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-wide">Overlay Studio</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">Create and preview OBS overlays</p>
      </div>

      {/* Theme Selection Grid with LIVE previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {overlayThemes.map((theme) => {
          const isSelected = settings.theme === theme.id;
          const isTransparent = transparencies[theme.id] ?? true;
          
          return (
            <div 
              key={theme.id}
              className={`glass rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                isSelected ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => updateSettings({ theme: theme.id })}
            >
              {/* LIVE Overlay Preview - REAL COMPONENT not screenshot */}
              <div className="relative aspect-video bg-black/80 overflow-hidden flex items-center justify-center p-2">
                <div className="transform scale-[0.35] origin-center">
                  <OverlayPreview 
                    theme={theme.id}
                    data={previewData}
                    isTransparent={isTransparent}
                  />
                </div>
              </div>
              
              {/* Theme Info + Transparency Toggle */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-display font-semibold uppercase tracking-wide text-sm">{theme.name}</p>
                  
                  {/* Per-overlay Transparency Toggle */}
                  <div 
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Label htmlFor={`transparency-${theme.id}`} className="text-[10px] text-muted-foreground cursor-pointer">
                      {isTransparent ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </Label>
                    <Switch
                      id={`transparency-${theme.id}`}
                      checked={isTransparent}
                      onCheckedChange={(checked) => updateTransparency(theme.id, checked)}
                      className="scale-75"
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-muted-foreground mb-3">
                  {theme.width}×{theme.height}px • {isTransparent ? 'Transparent' : 'Solid BG'}
                </p>
                
                {isSelected ? (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Selected</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full border-success/50 text-success hover:bg-success/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateSettings({ theme: theme.id });
                    }}
                  >
                    Select
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* OBS Browser Source URL */}
      <div className="glass rounded-xl p-4 md:p-6">
        <h3 className="font-display font-semibold text-lg mb-4">OBS Browser Source URL</h3>
        
        <div className="glass rounded-lg px-4 py-3 mb-4 font-mono text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
          {config.username ? getOBSUrl() : 'Configure player settings first...'}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            className="w-full"
            onClick={handleCopyUrl}
            disabled={!config.username}
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy OBS URL'}
          </Button>
          
          <Button 
            className="w-full bg-success hover:bg-success/90 text-background"
            onClick={handleOpenOverlay}
            disabled={!config.username}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Overlay
          </Button>
        </div>
        
        {/* Quick Setup */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground mb-2">Quick Setup:</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Copy the URL above</li>
            <li>Add a Browser Source in OBS</li>
            <li>Set width to {overlayThemes.find(t => t.id === settings.theme)?.width || 470}px, height to {overlayThemes.find(t => t.id === settings.theme)?.height || 60}px</li>
            <li>Enable "Refresh browser when scene becomes active"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
