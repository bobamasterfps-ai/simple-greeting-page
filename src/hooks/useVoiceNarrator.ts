/**
 * Voice Narrator - Browser TTS (free, reliable)
 * Uses Web Speech API for cross-browser support
 */
import { useCallback, useState, useRef } from 'react';

type Language = 'en' | 'hi';

interface UseVoiceNarratorReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  isSupported: boolean;
  isLoading: boolean;
}

export function useVoiceNarrator(): UseVoiceNarratorReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback(async (text: string) => {
    if (!isSupported) return;
    
    setIsLoading(true);
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Configure voice
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 1.1; // Slightly faster for tactical comms
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith(language === 'hi' ? 'hi' : 'en') && 
      (v.name.includes('Google') || v.name.includes('Microsoft'))
    ) || voices.find(v => v.lang.startsWith(language === 'hi' ? 'hi' : 'en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsLoading(false);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsLoading(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [language, isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    language,
    setLanguage,
    isSupported,
    isLoading,
  };
}

/**
 * Generate tactical voice script from strategy steps
 * Short, clear callouts like real IGL comms
 */
export function generateVoiceScript(
  steps: Array<{ agent: string; ability?: string; type: string }>,
  site: string,
  language: Language = 'en'
): string {
  if (language === 'hi') {
    return generateHindiVoiceScript(steps, site);
  }
  
  const calls: string[] = [];
  
  calls.push(`${site} execute.`);
  
  // Group by ability type
  const abilitySteps = steps.filter(s => s.type === 'ability' && s.ability);
  const smokeSteps = abilitySteps.filter(s => 
    s.ability?.toLowerCase().includes('smoke') || 
    s.ability?.toLowerCase().includes('cover') ||
    s.ability?.toLowerCase().includes('cloud')
  );
  const flashSteps = abilitySteps.filter(s => 
    s.ability?.toLowerCase().includes('flash') ||
    s.ability?.toLowerCase().includes('blind')
  );
  
  // Announce smokes first
  if (smokeSteps.length > 0) {
    const smokeAgents = [...new Set(smokeSteps.map(s => s.agent))];
    calls.push(`${smokeAgents.join(' and ')} smoke.`);
  }
  
  // Then flashes
  if (flashSteps.length > 0) {
    calls.push('Flash out.');
  }
  
  // Entry
  const moveSteps = steps.filter(s => s.type === 'move');
  if (moveSteps.length > 0) {
    const duelist = moveSteps.find(s => 
      ['Jett', 'Raze', 'Phoenix', 'Reyna', 'Neon', 'Yoru', 'Iso'].includes(s.agent)
    );
    if (duelist) {
      calls.push(`${duelist.agent} entry.`);
    } else {
      calls.push('Entry now.');
    }
  }
  
  calls.push('Trade fast. Plant default.');
  
  return calls.join(' ');
}

/**
 * Generate Hindi voice script
 */
export function generateHindiVoiceScript(
  steps: Array<{ agent: string; ability?: string; type: string }>,
  site: string
): string {
  const calls: string[] = [];
  
  calls.push(`${site} site execute karo.`);
  
  const abilitySteps = steps.filter(s => s.type === 'ability' && s.ability);
  
  if (abilitySteps.length > 0) {
    const agents = [...new Set(abilitySteps.slice(0, 2).map(s => s.agent))];
    calls.push(`${agents.join(' aur ')} utility daalo.`);
  }
  
  calls.push('Entry karo. Trade karo. Plant karo.');
  
  return calls.join(' ');
}

/**
 * Format chat callouts for in-game Valorant chat
 * Simple one-liner format: "Omen smoke Heaven Skye flash Main Jett entry Chamber flank"
 */
export function formatChatCallouts(
  steps: Array<{ agent: string; ability?: string; type: string; t?: number }>,
  site: string,
  side: string
): string {
  const parts: string[] = [];
  
  // Group steps by type
  const abilitySteps = steps.filter(s => s.type === 'ability' && s.ability);
  const moveSteps = steps.filter(s => s.type === 'move');
  
  // Get smoke agents with targets
  const smokeSteps = abilitySteps.filter(s => 
    s.ability?.toLowerCase().includes('smoke') || 
    s.ability?.toLowerCase().includes('cover') ||
    s.ability?.toLowerCase().includes('cloud') ||
    s.ability?.toLowerCase().includes('dark')
  );
  
  smokeSteps.forEach(s => {
    parts.push(`${s.agent} smoke ${site}`);
  });
  
  // Get flash agents
  const flashSteps = abilitySteps.filter(s => 
    s.ability?.toLowerCase().includes('flash') ||
    s.ability?.toLowerCase().includes('blind')
  );
  
  flashSteps.forEach(s => {
    parts.push(`${s.agent} flash ${site} Main`);
  });
  
  // Duelists entry
  const duelists = ['Jett', 'Raze', 'Phoenix', 'Reyna', 'Neon', 'Yoru', 'Iso'];
  const entryAgents = moveSteps.filter(s => duelists.includes(s.agent));
  
  if (entryAgents.length > 0) {
    const first = entryAgents[0];
    parts.push(`${first.agent} dash plant`);
  }
  
  // Support agents follow
  const supportAgents = moveSteps.filter(s => !duelists.includes(s.agent));
  supportAgents.slice(0, 1).forEach(s => {
    parts.push(`${s.agent} follow entry`);
  });
  
  // Sentinel hold flank
  const sentinels = ['Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock', 'Vyse'];
  const flankHolder = moveSteps.find(s => sentinels.includes(s.agent));
  if (flankHolder) {
    parts.push(`${flankHolder.agent} hold flank`);
  }
  
  return parts.join(' ');
}
