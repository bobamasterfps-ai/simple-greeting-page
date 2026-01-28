import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AGENT_IMAGES } from '@/lib/agentImages';
import { Crosshair, Shield, Sword, MapPin, Loader2, Target, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Lineup {
  id: string;
  agent: string;
  side: string;
  map: string;
  ability: string | null;
  image_url: string;
  title: string;
  description: string | null;
}

interface LineupImage {
  id: string;
  lineup_id: string;
  image_type: string;
  image_url: string;
  display_order: number;
}

const MAPS = ['Ascent', 'Bind', 'Breeze', 'Fracture', 'Haven', 'Icebox', 'Lotus', 'Pearl', 'Split', 'Sunset', 'Abyss'];
const AGENTS = Object.keys(AGENT_IMAGES);

const ABILITIES_BY_AGENT: Record<string, string[]> = {
  'Viper': ['Snake Bite', 'Poison Cloud', 'Toxic Screen', "Viper's Pit"],
  'Sova': ['Recon Bolt', 'Shock Bolt', 'Owl Drone', "Hunter's Fury"],
  'Brimstone': ['Incendiary', 'Sky Smoke', 'Stim Beacon', 'Orbital Strike'],
  'Killjoy': ['Nanoswarm', 'Alarmbot', 'Turret', 'Lockdown'],
  'Cypher': ['Trapwire', 'Cyber Cage', 'Spycam', 'Neural Theft'],
  'Kay/O': ['FLASH/drive', 'FRAG/ment', 'ZERO/point', 'NULL/cmd'],
  'Gekko': ['Mosh Pit', 'Wingman', 'Dizzy', 'Thrash'],
  'Fade': ['Seize', 'Haunt', 'Prowler', 'Nightfall'],
  'Omen': ['Dark Cover', 'Paranoia', 'Shrouded Step', 'From the Shadows'],
  'Astra': ['Gravity Well', 'Nova Pulse', 'Nebula', 'Astral Form'],
};

const IMAGE_TYPE_ORDER = ['throw', 'aim', 'result'];
const IMAGE_TYPE_LABELS: Record<string, string> = {
  'throw': '1️⃣ Stand Position',
  'aim': '2️⃣ Aim Position', 
  'result': '3️⃣ Landing Spot'
};

export function LineupsPage() {
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [lineupImages, setLineupImages] = useState<Record<string, LineupImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'attack' | 'defense'>('attack');
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [selectedLineup, setSelectedLineup] = useState<Lineup | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchLineups();
  }, [selectedAgent, selectedSide, selectedMap, selectedAbility]);

  const fetchLineups = async () => {
    setLoading(true);
    let query = supabase.from('lineups').select('*');
    
    if (selectedAgent) query = query.eq('agent', selectedAgent);
    if (selectedSide) query = query.eq('side', selectedSide);
    if (selectedMap) query = query.eq('map', selectedMap);
    if (selectedAbility) query = query.eq('ability', selectedAbility);
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching lineups:', error);
    } else {
      setLineups((data as Lineup[]) || []);
      
      // Fetch images for all lineups
      if (data && data.length > 0) {
        const lineupIds = data.map(l => l.id);
        const { data: images } = await supabase
          .from('lineup_images')
          .select('*')
          .in('lineup_id', lineupIds)
          .order('display_order');
        
        if (images) {
          const grouped: Record<string, LineupImage[]> = {};
          (images as LineupImage[]).forEach(img => {
            if (!grouped[img.lineup_id]) grouped[img.lineup_id] = [];
            grouped[img.lineup_id].push(img);
          });
          setLineupImages(grouped);
        }
      }
    }
    setLoading(false);
  };

  const availableAbilities = selectedAgent ? (ABILITIES_BY_AGENT[selectedAgent] || ['Utility']) : [];

  const openLineup = (lineup: Lineup) => {
    setSelectedLineup(lineup);
    setCurrentImageIndex(0);
  };

  const getLineupImagesOrdered = (lineupId: string) => {
    const images = lineupImages[lineupId] || [];
    return images.sort((a, b) => {
      const orderA = IMAGE_TYPE_ORDER.indexOf(a.image_type);
      const orderB = IMAGE_TYPE_ORDER.indexOf(b.image_type);
      return orderA - orderB;
    });
  };

  const nextImage = () => {
    if (!selectedLineup) return;
    const images = getLineupImagesOrdered(selectedLineup.id);
    setCurrentImageIndex((prev) => (prev + 1) % Math.max(1, images.length));
  };

  const prevImage = () => {
    if (!selectedLineup) return;
    const images = getLineupImagesOrdered(selectedLineup.id);
    setCurrentImageIndex((prev) => (prev - 1 + Math.max(1, images.length)) % Math.max(1, images.length));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Lineups</h2>
          <p className="text-sm text-muted-foreground">Step-by-step lineup guides with throw, aim, and result positions</p>
        </div>
        <div className="flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Side Toggle */}
      <div className="flex gap-2">
        <Button
          variant={selectedSide === 'attack' ? 'default' : 'outline'}
          onClick={() => setSelectedSide('attack')}
          className="gap-2"
        >
          <Sword className="w-4 h-4" />
          Attack
        </Button>
        <Button
          variant={selectedSide === 'defense' ? 'default' : 'outline'}
          onClick={() => setSelectedSide('defense')}
          className="gap-2"
        >
          <Shield className="w-4 h-4" />
          Defense
        </Button>
      </div>

      {/* Agent Grid */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Select Agent</h3>
        <div className="grid grid-cols-6 md:grid-cols-10 gap-2">
          {AGENTS.map((agent) => (
            <button
              key={agent}
              onClick={() => {
                setSelectedAgent(selectedAgent === agent ? null : agent);
                setSelectedAbility(null); // Reset ability when agent changes
              }}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedAgent === agent 
                  ? 'border-primary ring-2 ring-primary/30 scale-105' 
                  : 'border-border/50 hover:border-primary/50'
              }`}
            >
              <img
                src={AGENT_IMAGES[agent]}
                alt={agent}
                className="w-full h-full object-cover"
              />
              {selectedAgent === agent && (
                <div className="absolute inset-0 bg-primary/20" />
              )}
            </button>
          ))}
        </div>
        {selectedAgent && (
          <p className="text-sm text-primary mt-2">Selected: {selectedAgent}</p>
        )}
      </div>

      {/* Ability Filter - Shows when agent is selected */}
      {selectedAgent && availableAbilities.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Filter by Ability
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedAbility === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedAbility(null)}
            >
              All
            </Button>
            {availableAbilities.map((ability) => (
              <Button
                key={ability}
                variant={selectedAbility === ability ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAbility(selectedAbility === ability ? null : ability)}
              >
                {ability}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Map Selector */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Select Map
        </h3>
        <div className="flex flex-wrap gap-2">
          {MAPS.map((map) => (
            <Button
              key={map}
              variant={selectedMap === map ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMap(selectedMap === map ? null : map)}
            >
              {map}
            </Button>
          ))}
        </div>
      </div>

      {/* Lineups Grid */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {loading ? 'Loading...' : `${lineups.length} Lineups Found`}
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : lineups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Crosshair className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No lineups found for this selection.</p>
            <p className="text-sm">Try changing your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lineups.map((lineup) => {
              const images = getLineupImagesOrdered(lineup.id);
              return (
                <button
                  key={lineup.id}
                  onClick={() => openLineup(lineup)}
                  className="glass rounded-lg overflow-hidden text-left hover:ring-2 hover:ring-primary/50 transition-all"
                >
                  <div className="aspect-video bg-card relative">
                    <img
                      src={images[0]?.image_url || lineup.image_url}
                      alt={lineup.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <img
                        src={AGENT_IMAGES[lineup.agent] || AGENT_IMAGES['Jett']}
                        alt={lineup.agent}
                        className="w-8 h-8 rounded-full border-2 border-background"
                      />
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        lineup.side === 'attack' ? 'bg-destructive/80' : 'bg-success/80'
                      }`}>
                        {lineup.side}
                      </span>
                    </div>
                    {images.length > 1 && (
                      <div className="absolute bottom-2 right-2 text-xs bg-background/80 px-2 py-0.5 rounded">
                        {images.length} steps
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm">{lineup.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{lineup.map}</span>
                      {lineup.ability && (
                        <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {lineup.ability}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Lineup Modal with Step-by-Step Images */}
      {selectedLineup && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLineup(null)}
        >
          <div 
            className="glass rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Viewer */}
            <div className="relative">
              {(() => {
                const images = getLineupImagesOrdered(selectedLineup.id);
                const currentImage = images[currentImageIndex] || { image_url: selectedLineup.image_url, image_type: 'throw' };
                
                return (
                  <>
                    <img
                      src={currentImage.image_url}
                      alt={`${selectedLineup.title} - ${currentImage.image_type}`}
                      className="w-full aspect-video object-cover rounded-t-xl"
                    />
                    
                    {/* Step Indicator */}
                    <div className="absolute top-4 left-4 bg-background/90 rounded px-3 py-1.5 text-sm font-medium">
                      {IMAGE_TYPE_LABELS[currentImage.image_type] || currentImage.image_type}
                    </div>
                    
                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full p-2 transition-colors"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                    
                    {/* Step Dots */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              idx === currentImageIndex ? 'bg-primary' : 'bg-background/60 hover:bg-background'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={AGENT_IMAGES[selectedLineup.agent] || AGENT_IMAGES['Jett']}
                  alt={selectedLineup.agent}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-display font-bold text-xl">{selectedLineup.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedLineup.agent} • {selectedLineup.map} • {selectedLineup.side}
                    {selectedLineup.ability && ` • ${selectedLineup.ability}`}
                  </p>
                </div>
              </div>
              
              {/* Instructions */}
              {selectedLineup.description && (
                <div className="bg-card rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-sm mb-2 text-primary">📝 Instructions</h4>
                  <p className="text-foreground/80 text-sm">{selectedLineup.description}</p>
                </div>
              )}
              
              {/* Step Thumbnails */}
              {(() => {
                const images = getLineupImagesOrdered(selectedLineup.id);
                if (images.length > 1) {
                  return (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Steps</h4>
                      <div className="flex gap-2">
                        {images.map((img, idx) => (
                          <button
                            key={img.id}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`flex-1 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                              idx === currentImageIndex ? 'border-primary' : 'border-border/50'
                            }`}
                          >
                            <img
                              src={img.image_url}
                              alt={img.image_type}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              <Button 
                className="w-full"
                onClick={() => setSelectedLineup(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Attribution Footer */}
      <p className="text-xs text-center text-muted-foreground">
        Lineup data collected and structured for learning purposes
      </p>
    </div>
  );
}
