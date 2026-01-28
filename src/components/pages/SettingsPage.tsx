import { useOverlay } from '@/context/OverlayContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function SettingsPage() {
  const { settings, updateSettings } = useOverlay();

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-wide">Configuration Hub</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">All settings in one place</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="behavioral" className="w-full">
        <TabsList className="glass border border-border/30 p-1 h-auto flex-wrap">
          <TabsTrigger value="behavioral" className="data-[state=active]:bg-secondary">Behavioral</TabsTrigger>
          <TabsTrigger value="visual" className="data-[state=active]:bg-secondary">Visual</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-secondary">API</TabsTrigger>
          <TabsTrigger value="overlay" className="data-[state=active]:bg-secondary">Overlay</TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-secondary">Preferences</TabsTrigger>
        </TabsList>

        {/* Behavioral Systems */}
        <TabsContent value="behavioral" className="mt-6">
          <div className="glass rounded-xl p-4 md:p-6">
            <h3 className="font-display font-semibold text-lg mb-1">Behavioral Systems</h3>
            <p className="text-sm text-muted-foreground mb-6">Configure tracking behavior</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="auto-start" className="cursor-pointer">Auto-start sessions</Label>
                <Checkbox id="auto-start" />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="track-afk" className="cursor-pointer">Track AFK time</Label>
                <Checkbox id="track-afk" />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Visual */}
        <TabsContent value="visual" className="mt-6">
          <div className="glass rounded-xl p-4 md:p-6">
            <h3 className="font-display font-semibold text-lg mb-1">Visual Fidelity</h3>
            <p className="text-sm text-muted-foreground mb-6">Customize visual effects</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="win-flash" className="cursor-pointer">Win Flash Animation</Label>
                <Checkbox 
                  id="win-flash"
                  checked={settings.showWinFlash}
                  onCheckedChange={(checked) => updateSettings({ showWinFlash: !!checked })}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="loss-flash" className="cursor-pointer">Loss Flash Animation</Label>
                <Checkbox 
                  id="loss-flash"
                  checked={settings.showLossFlash}
                  onCheckedChange={(checked) => updateSettings({ showLossFlash: !!checked })}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="particles" className="cursor-pointer">Particle Effects</Label>
                <Checkbox 
                  id="particles"
                  checked={settings.showParticles}
                  onCheckedChange={(checked) => updateSettings({ showParticles: !!checked })}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="promo-glow" className="cursor-pointer">Promo Glow</Label>
                <Checkbox 
                  id="promo-glow"
                  checked={settings.showPromoGlow}
                  onCheckedChange={(checked) => updateSettings({ showPromoGlow: !!checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="mt-6">
          <div className="glass rounded-xl p-4 md:p-6">
            <h3 className="font-display font-semibold text-lg mb-1">API Management</h3>
            <p className="text-sm text-muted-foreground mb-6">Configure API settings</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="block">Refresh Interval</Label>
                  <p className="text-xs text-muted-foreground">How often to poll for updates</p>
                </div>
                <select 
                  className="glass rounded-lg px-3 py-2 text-sm border border-border/30 bg-secondary"
                  value={settings.refreshInterval}
                  onChange={(e) => updateSettings({ refreshInterval: parseInt(e.target.value) })}
                >
                  <option value={15000}>15 seconds</option>
                  <option value={30000}>30 seconds</option>
                  <option value={60000}>60 seconds</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Overlay */}
        <TabsContent value="overlay" className="mt-6">
          <div className="glass rounded-xl p-4 md:p-6">
            <h3 className="font-display font-semibold text-lg mb-1">Overlay Defaults</h3>
            <p className="text-sm text-muted-foreground mb-6">Default overlay settings</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="show-mascot" className="cursor-pointer">Show Mascot Logo</Label>
                <Checkbox 
                  id="show-mascot"
                  checked={settings.showMascot}
                  onCheckedChange={(checked) => updateSettings({ showMascot: !!checked })}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="donation-badge" className="cursor-pointer">Show Donation Badge</Label>
                <Checkbox 
                  id="donation-badge"
                  checked={settings.showDonationBadge}
                  onCheckedChange={(checked) => updateSettings({ showDonationBadge: !!checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="mt-6">
          <div className="glass rounded-xl p-4 md:p-6">
            <h3 className="font-display font-semibold text-lg mb-1">User Preferences</h3>
            <p className="text-sm text-muted-foreground mb-6">Personal settings</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="block">Theme</Label>
                  <p className="text-xs text-muted-foreground">Dashboard appearance</p>
                </div>
                <select className="glass rounded-lg px-3 py-2 text-sm border border-border/30 bg-secondary">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
