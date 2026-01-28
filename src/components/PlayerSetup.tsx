import { useOverlay } from '@/context/OverlayContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ExternalLink, Play, Square } from 'lucide-react';

const regions = [
  { value: 'na', label: 'North America' },
  { value: 'eu', label: 'Europe' },
  { value: 'ap', label: 'Asia Pacific' },
  { value: 'kr', label: 'Korea' },
  { value: 'latam', label: 'Latin America' },
  { value: 'br', label: 'Brazil' },
];

const platforms = [
  { value: 'pc', label: 'PC' },
  { value: 'console', label: 'Console' },
];

interface PlayerSetupProps {
  hideHeader?: boolean;
}

export function PlayerSetup({ hideHeader = false }: PlayerSetupProps) {
  const { 
    config, 
    updateConfig, 
    connectionStatus, 
    apiEnabled,
    enableAPI,
    disableAPI,
  } = useOverlay();

  const isConfigured = config.username && config.tag && config.apiKey;
  const isConnecting = connectionStatus === 'connecting';

  const handleConnect = () => {
    if (isConfigured) {
      enableAPI();
    }
  };

  const handleDisconnect = () => {
    disableAPI();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="apiKey" className="text-sm">Henrik Dev API Key</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder="••••••••••••••••••••••••••••••••"
          value={config.apiKey}
          onChange={(e) => updateConfig({ apiKey: e.target.value })}
          disabled={apiEnabled}
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Get your free API key at{' '}
          <a 
            href="https://henrikdev.xyz/keys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            henrikdev.xyz/keys
          </a>
        </p>
      </div>

      {/* Username and Tag */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm">Username</Label>
          <Input
            id="username"
            placeholder="RezMelRL"
            value={config.username}
            onChange={(e) => updateConfig({ username: e.target.value })}
            disabled={apiEnabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tag" className="text-sm">Tag</Label>
          <Input
            id="tag"
            placeholder="6969"
            value={config.tag}
            onChange={(e) => updateConfig({ tag: e.target.value })}
            disabled={apiEnabled}
          />
        </div>
      </div>

      {/* Region and Platform */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Region</Label>
          <Select
            value={config.region}
            onValueChange={(value) => updateConfig({ region: value })}
            disabled={apiEnabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Asia Pacific" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Platform</Label>
          <Select
            value={config.platform}
            onValueChange={(value) => updateConfig({ platform: value })}
            disabled={apiEnabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="PC" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {apiEnabled ? (
          <>
            <Button 
              className="flex-1 bg-success hover:bg-success/90 text-background"
              onClick={handleConnect}
            >
              Update
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button 
            className="flex-1 bg-success hover:bg-success/90 text-background"
            onClick={handleConnect}
            disabled={!isConfigured || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Update'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
