import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Send, Loader2, User, Bot, Sparkles, MapPin, Shield, Sword, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AGENT_IMAGES } from '@/lib/agentImages';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface CoachContext {
  map?: string;
  agent?: string;
  rank?: string;
  situation?: string;
}

const MAPS = ['Ascent', 'Bind', 'Breeze', 'Fracture', 'Haven', 'Icebox', 'Lotus', 'Pearl', 'Split', 'Sunset', 'Abyss'];
const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'];
const SITUATIONS = ['Attack', 'Defense', 'Retake', 'Clutch', 'Eco Round', 'Post-Plant'];
const AGENTS = Object.keys(AGENT_IMAGES);

const RADIANT_PROMPTS = [
  "How do I entry A site on [map] as [agent]?",
  "Best default holds for [agent] on [map] defense?",
  "How do I win 1v2 clutches consistently?",
  "What's the correct trade order for executes?",
  "How do pros reset mentally after losing pistol?",
  "Best anti-rush utility timing as a Sentinel?",
];

export function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<CoachContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContextString = () => {
    const parts = [];
    if (context.map) parts.push(`Map: ${context.map}`);
    if (context.agent) parts.push(`Agent: ${context.agent}`);
    if (context.rank) parts.push(`Rank: ${context.rank}`);
    if (context.situation) parts.push(`Situation: ${context.situation}`);
    return parts.length > 0 ? parts.join(' | ') : undefined;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { 
          message: text.trim(),
          context: buildContextString()
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Coach error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from coach',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleContext = (key: keyof CoachContext, value: string) => {
    setContext(prev => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value
    }));
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Radiant Coach
          </h2>
          <p className="text-sm text-muted-foreground">Radiant-level tactical coaching • IGL + Analyst + Mental</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-primary text-sm">
          <Sparkles className="w-4 h-4" />
          Radiant AI
        </div>
      </div>

      {/* Context Selectors */}
      <div className="glass rounded-xl p-3 space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Set Context (optional)</p>
        
        {/* Map */}
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          {MAPS.slice(0, 6).map(map => (
            <Button
              key={map}
              size="sm"
              variant={context.map === map ? 'default' : 'outline'}
              className="text-xs h-7"
              onClick={() => toggleContext('map', map)}
            >
              {map}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="text-xs h-7">+{MAPS.length - 6}</Button>
        </div>

        {/* Agent */}
        <div className="flex items-center gap-2 flex-wrap">
          <Target className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            {AGENTS.slice(0, 8).map(agent => (
              <button
                key={agent}
                onClick={() => toggleContext('agent', agent)}
                className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                  context.agent === agent ? 'border-primary scale-110' : 'border-transparent hover:border-primary/50'
                }`}
              >
                <img src={AGENT_IMAGES[agent]} alt={agent} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Rank + Situation */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            {RANKS.slice(4).map(rank => (
              <Button
                key={rank}
                size="sm"
                variant={context.rank === rank ? 'default' : 'outline'}
                className="text-xs h-7"
                onClick={() => toggleContext('rank', rank)}
              >
                {rank}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Sword className="w-4 h-4 text-muted-foreground" />
          {SITUATIONS.map(sit => (
            <Button
              key={sit}
              size="sm"
              variant={context.situation === sit ? 'default' : 'outline'}
              className="text-xs h-7"
              onClick={() => toggleContext('situation', sit)}
            >
              {sit}
            </Button>
          ))}
        </div>

        {/* Active Context Display */}
        {Object.values(context).some(Boolean) && (
          <div className="text-xs text-primary bg-primary/10 rounded px-2 py-1 inline-block">
            Context: {buildContextString()}
          </div>
        )}
      </div>

      {/* Chat Container */}
      <div className="glass rounded-xl flex-1 flex flex-col min-h-[400px] max-h-[500px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 text-primary/50" />
              <h3 className="font-display font-semibold text-lg mb-2">Radiant-Level Coaching</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Set your context above, then ask tactical questions
              </p>
              
              {/* Radiant Prompts */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {RADIANT_PROMPTS.slice(0, 4).map((prompt) => (
                  <Button
                    key={prompt}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(prompt)}
                    className="text-xs"
                  >
                    {prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask tactical questions: entries, holds, utility, clutches, mental..."
              className="min-h-[44px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[44px] w-[44px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
