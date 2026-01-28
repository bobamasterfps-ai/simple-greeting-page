/**
 * Strategies Hook - CRUD operations for saved strategies
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { StrategyData } from '@/lib/strategyTypes';
import { toast } from 'sonner';

export interface SavedStrategy {
  id: string;
  creator_id: string;
  team_id: string | null;
  map: string;
  site: string;
  side: string;
  rank: string;
  playstyle: string | null;
  json_data: StrategyData;
  locked: boolean | null;
  visibility: 'private' | 'team' | 'public';
  title: string | null;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Computed fields
  avg_rating?: number;
  win_rate?: number;
  rating_count?: number;
}

export interface StrategyFilters {
  map?: string;
  side?: string;
  rank?: string;
  visibility?: string;
}

export function useStrategies() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<SavedStrategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserStrategies = useCallback(async (filters?: StrategyFilters) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('strategies')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.map) query = query.eq('map', filters.map);
      if (filters?.side) query = query.eq('side', filters.side);
      if (filters?.rank) query = query.eq('rank', filters.rank);

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch ratings for each strategy
      const strategiesWithRatings = await Promise.all(
        (data || []).map(async (s) => {
          // Use database functions for ratings
          const [avgRatingResult, winRateResult] = await Promise.all([
            supabase.rpc('get_strategy_avg_rating', { strategy_uuid: s.id }),
            supabase.rpc('get_strategy_win_rate', { strategy_uuid: s.id }),
          ]);
          
          const { data: ratingsCount } = await supabase
            .from('strategy_ratings')
            .select('id', { count: 'exact', head: true })
            .eq('strategy_id', s.id);
          
          const jsonData = s.json_data as unknown as StrategyData;
          
          return {
            ...s,
            json_data: jsonData,
            visibility: (s.visibility || 'private') as 'private' | 'team' | 'public',
            avg_rating: avgRatingResult.data || 0,
            win_rate: winRateResult.data || 0,
            rating_count: ratingsCount || 0,
          } as SavedStrategy;
        })
      );
      
      setStrategies(strategiesWithRatings);
    } catch (e) {
      console.error('Failed to fetch strategies:', e);
      toast.error('Failed to load strategies');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchPublicStrategies = useCallback(async (filters?: StrategyFilters) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('strategies')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filters?.map) query = query.eq('map', filters.map);
      if (filters?.side) query = query.eq('side', filters.side);
      if (filters?.rank) query = query.eq('rank', filters.rank);

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch ratings for public strategies
      const strategiesWithRatings = await Promise.all(
        (data || []).map(async (s) => {
          const [avgRatingResult, winRateResult] = await Promise.all([
            supabase.rpc('get_strategy_avg_rating', { strategy_uuid: s.id }),
            supabase.rpc('get_strategy_win_rate', { strategy_uuid: s.id }),
          ]);
          
          const jsonData = s.json_data as unknown as StrategyData;
          
          return {
            ...s,
            json_data: jsonData,
            visibility: (s.visibility || 'public') as 'private' | 'team' | 'public',
            avg_rating: avgRatingResult.data || 0,
            win_rate: winRateResult.data || 0,
          } as SavedStrategy;
        })
      );
      
      setStrategies(strategiesWithRatings);
    } catch (e) {
      console.error('Failed to fetch public strategies:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveStrategy = useCallback(async (
    strategy: StrategyData,
    metadata: {
      map: string;
      site: string;
      side: string;
      rank: string;
      playstyle: string;
      title?: string;
      visibility?: 'private' | 'team' | 'public';
    }
  ): Promise<string | null> => {
    if (!user) {
      toast.error('Login required to save strategies');
      return null;
    }

    try {
      const insertData = {
        creator_id: user.id,
        map: metadata.map,
        site: metadata.site,
        side: metadata.side,
        rank: metadata.rank,
        playstyle: metadata.playstyle,
        title: metadata.title || `${metadata.map} ${metadata.site} ${metadata.side}`,
        visibility: metadata.visibility || 'private',
        json_data: JSON.parse(JSON.stringify(strategy)),
      };
      
      const { data, error } = await supabase
        .from('strategies')
        .insert(insertData)
        .select('id')
        .single();

      if (error) throw error;
      
      toast.success('Strategy saved!');
      return data.id;
    } catch (e) {
      console.error('Failed to save strategy:', e);
      toast.error('Failed to save strategy');
      return null;
    }
  }, [user]);

  const deleteStrategy = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setStrategies(prev => prev.filter(s => s.id !== id));
      toast.success('Strategy deleted');
    } catch (e) {
      console.error('Failed to delete strategy:', e);
      toast.error('Failed to delete strategy');
    }
  }, []);

  const rateStrategy = useCallback(async (
    strategyId: string,
    rating: number,
    worked?: boolean
  ) => {
    if (!user) {
      toast.error('Login required to rate');
      return;
    }

    try {
      // Check if rating exists
      const { data: existing } = await supabase
        .from('strategy_ratings')
        .select('id')
        .eq('strategy_id', strategyId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('strategy_ratings')
          .update({ rating, worked })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('strategy_ratings')
          .insert({
            strategy_id: strategyId,
            user_id: user.id,
            rating,
            worked,
          });
        
        if (error) throw error;
      }
      
      toast.success('Rating saved!');
    } catch (e) {
      console.error('Failed to rate strategy:', e);
      toast.error('Failed to save rating');
    }
  }, [user]);

  const updateVisibility = useCallback(async (
    id: string,
    visibility: 'private' | 'team' | 'public'
  ) => {
    try {
      const { error } = await supabase
        .from('strategies')
        .update({ visibility })
        .eq('id', id);
      
      if (error) throw error;
      
      setStrategies(prev => prev.map(s => 
        s.id === id ? { ...s, visibility } : s
      ));
      toast.success(`Strategy is now ${visibility}`);
    } catch (e) {
      console.error('Failed to update visibility:', e);
      toast.error('Failed to update');
    }
  }, []);

  return {
    strategies,
    isLoading,
    fetchUserStrategies,
    fetchPublicStrategies,
    saveStrategy,
    deleteStrategy,
    rateStrategy,
    updateVisibility,
  };
}
