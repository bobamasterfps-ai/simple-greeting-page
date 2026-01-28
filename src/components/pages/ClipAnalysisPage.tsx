import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Video, Upload, Loader2, CheckCircle, XCircle, Lightbulb, Plus, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function ClipAnalysisPage() {
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [context, setContext] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addImageSlot = () => {
    if (imageUrls.length < 8) {
      setImageUrls([...imageUrls, '']);
    }
  };

  const removeImageSlot = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const validUrls = imageUrls.filter(url => url.trim());

  const analyzeClip = async () => {
    if (validUrls.length === 0) {
      toast({
        title: 'Images Required',
        description: 'Please provide at least one image URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-clip', {
        body: { 
          imageUrls: validUrls,
          context: context.trim() 
        }
      });

      if (error) throw error;

      // Handle graceful error responses (ok: false)
      if (data && data.ok === false) {
        toast({
          title: 'Analysis Issue',
          description: data.error || 'Could not analyze the images. Try a different URL.',
          variant: 'destructive',
        });
        return;
      }

      setAnalysis(data.analysis);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not connect to AI service. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse analysis into sections - improved parsing
  const parseAnalysis = (text: string) => {
    const sections = {
      good: [] as string[],
      mistakes: [] as string[],
      improvements: [] as string[],
    };

    const lines = text.split('\n');
    let currentSection: 'good' | 'mistakes' | 'improvements' | null = null;

    lines.forEach(line => {
      const lower = line.toLowerCase();
      const trimmed = line.trim();
      
      // Detect section headers - check for various patterns
      if (lower.includes('good play') || lower.includes('✅') || lower.includes('** good') || lower.includes('**good')) {
        currentSection = 'good';
        return;
      } else if (lower.includes('mistake') || lower.includes('❌') || lower.includes('** mistake') || lower.includes('**mistake')) {
        currentSection = 'mistakes';
        return;
      } else if (lower.includes('improvement') || lower.includes('🎯') || lower.includes('radiant') || lower.includes('** radiant') || lower.includes('**radiant')) {
        currentSection = 'improvements';
        return;
      }
      
      // Extract bullet points - handle various formats
      if (currentSection && trimmed.length > 0) {
        // Match bullet points: •, -, *, numbered, or lines starting with **
        const bulletMatch = trimmed.match(/^(?:[-•*]|\d+\.|\*\*)\s*(.+)/);
        if (bulletMatch) {
          // Clean up the text - remove markdown bold markers
          let content = bulletMatch[1].replace(/\*\*/g, '').trim();
          // Also handle inline bold like **text:**
          content = content.replace(/^\*\*(.+?)\*\*:?\s*/, '$1: ');
          if (content.length > 0) {
            sections[currentSection].push(content);
          }
        } else if (!trimmed.startsWith('**') && !trimmed.startsWith('#') && trimmed.length > 5) {
          // Regular text that follows a section header (continuation)
          sections[currentSection].push(trimmed.replace(/\*\*/g, ''));
        }
      }
    });

    return sections;
  };

  const analysisData = analysis ? parseAnalysis(analysis) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Radiant Clip Analysis
          </h2>
          <p className="text-sm text-muted-foreground">AI-powered Radiant-level gameplay analysis</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="glass rounded-xl p-6">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Add Screenshots (1-8 frames for sequence analysis)
        </h3>
        
        <div className="space-y-3">
          {imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={url}
                  onChange={(e) => updateImageUrl(index, e.target.value)}
                  placeholder={`Frame ${index + 1} URL (e.g., https://imgur.com/...)`}
                  className="font-mono text-sm"
                />
              </div>
              {imageUrls.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImageSlot(index)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          
          {imageUrls.length < 8 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addImageSlot}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Frame ({imageUrls.length}/8)
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            💡 For sequence analysis: Add 5-8 frames from different moments in the same play
          </p>
        </div>

        <div className="mt-4">
          <label className="text-sm text-muted-foreground block mb-2">
            Context (agent, map, situation)
          </label>
          <Textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., 'Playing Jett on Ascent A site, 1v3 clutch, enemies have Odin + OP'"
            className="min-h-[60px]"
          />
        </div>

        <Button
          onClick={analyzeClip}
          disabled={isLoading || validUrls.length === 0}
          className="w-full gap-2 mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing {validUrls.length} frame{validUrls.length > 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Radiant Analysis ({validUrls.length} frame{validUrls.length > 1 ? 's' : ''})
            </>
          )}
        </Button>
      </div>

      {/* Previews */}
      {validUrls.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="font-medium mb-3">Frame Previews</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {validUrls.map((url, index) => (
              <div key={index} className="aspect-video bg-card rounded-lg overflow-hidden relative group">
                <img
                  src={url}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-lg">Radiant Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Good Plays */}
            <div className="glass rounded-xl p-4 border-l-4 border-success">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-success" />
                <h4 className="font-medium">Good Plays</h4>
              </div>
              {analysisData?.good.length ? (
                <ul className="space-y-2">
                  {analysisData.good.map((item, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex gap-2">
                      <span className="text-success">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Review full analysis below</p>
              )}
            </div>

            {/* Mistakes */}
            <div className="glass rounded-xl p-4 border-l-4 border-destructive">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-5 h-5 text-destructive" />
                <h4 className="font-medium">Mistakes</h4>
              </div>
              {analysisData?.mistakes.length ? (
                <ul className="space-y-2">
                  {analysisData.mistakes.map((item, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex gap-2">
                      <span className="text-destructive">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Review full analysis below</p>
              )}
            </div>

            {/* Radiant Improvements */}
            <div className="glass rounded-xl p-4 border-l-4 border-primary">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-primary" />
                <h4 className="font-medium">Radiant Fix</h4>
              </div>
              {analysisData?.improvements.length ? (
                <ul className="space-y-2">
                  {analysisData.improvements.map((item, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex gap-2">
                      <span className="text-primary">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Review full analysis below</p>
              )}
            </div>
          </div>

          {/* Full Analysis */}
          <div className="glass rounded-xl p-4">
            <h4 className="font-medium mb-3">Full Radiant Analysis</h4>
            <div className="prose prose-sm prose-invert max-w-none">
              <p className="text-foreground/80 whitespace-pre-wrap">{analysis}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
