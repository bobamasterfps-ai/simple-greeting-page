import { Settings, Volume2, Type, Palette, Clock, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClipSettings, ClipMode, AspectPreset, FontStyle, SubtitleColor } from '@/types/shortsTypes';
import { MODE_CONFIGS, PRESET_CONFIGS, FONT_STYLES, SUBTITLE_COLORS, DEFAULT_SETTINGS } from '@/types/shortsTypes';
import { cn } from '@/lib/utils';

interface ShortsSettingsProps {
  settings: ClipSettings;
  onUpdate: <K extends keyof ClipSettings>(key: K, value: ClipSettings[K]) => void;
  onReset: () => void;
}

export function ShortsSettings({ settings, onUpdate, onReset }: ShortsSettingsProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Clip Mode
          </CardTitle>
          <CardDescription>
            Choose the style for your generated clips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(MODE_CONFIGS).map((mode) => (
              <button
                key={mode.id}
                onClick={() => onUpdate('mode', mode.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  settings.mode === mode.id
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="text-2xl mb-2">{mode.emoji}</div>
                <div className="font-semibold">{mode.label}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aspect Ratio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-primary" />
            Aspect Ratio
          </CardTitle>
          <CardDescription>
            Choose the output format for your clips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(PRESET_CONFIGS).map((preset) => (
              <button
                key={preset.id}
                onClick={() => onUpdate('preset', preset.id)}
                className={cn(
                  "p-3 rounded-lg border-2 text-center transition-all",
                  settings.preset === preset.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="text-xl mb-1">{preset.icon}</div>
                <div className="text-sm font-medium">{preset.label}</div>
                <div className="text-xs text-muted-foreground">{preset.dimensions}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subtitle Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            Subtitle Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Auto-Subtitles</Label>
              <p className="text-xs text-muted-foreground">
                Generate captions from speech using AI
              </p>
            </div>
            <Switch
              checked={settings.enableSubtitles}
              onCheckedChange={(v) => onUpdate('enableSubtitles', v)}
            />
          </div>

          {settings.enableSubtitles && (
            <>
              <div className="space-y-2">
                <Label>Font Style</Label>
                <Select
                  value={settings.fontStyle}
                  onValueChange={(v) => onUpdate('fontStyle', v as FontStyle)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_STYLES.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subtitle Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {SUBTITLE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => onUpdate('subtitleColor', color.id)}
                      className={cn(
                        "w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center",
                        settings.subtitleColor === color.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      )}
                      style={{
                        background: color.id === 'auto' 
                          ? 'linear-gradient(135deg, #ff6b6b, #ffa500, #4ecdc4)' 
                          : color.hex
                      }}
                      title={color.label}
                    >
                      {color.id === 'auto' && <span className="text-xs font-bold">AI</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Words Per Line</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {settings.wordsPerLine}
                  </span>
                </div>
                <Slider
                  value={[settings.wordsPerLine]}
                  onValueChange={([v]) => onUpdate('wordsPerLine', v)}
                  min={1}
                  max={6}
                  step={1}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Timing & Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Timing & Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pre-Roll (Before Event)</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {(settings.preRollMs / 1000).toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[settings.preRollMs]}
                onValueChange={([v]) => onUpdate('preRollMs', v)}
                min={1000}
                max={10000}
                step={500}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Post-Roll (After Event)</Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {(settings.postRollMs / 1000).toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[settings.postRollMs]}
                onValueChange={([v]) => onUpdate('postRollMs', v)}
                min={1000}
                max={8000}
                step={500}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <Label>Audio Sensitivity</Label>
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {Math.round(settings.audioSensitivity * 100)}%
              </span>
            </div>
            <Slider
              value={[settings.audioSensitivity]}
              onValueChange={([v]) => onUpdate('audioSensitivity', v)}
              min={0.1}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">
              Higher sensitivity detects more events but may include false positives
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onReset}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
