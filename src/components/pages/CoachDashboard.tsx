/**
 * Coach Dashboard - Team Analytics & Strategy Management
 * Shows win rates, reliability scores, best strategies, match history
 * Only accessible to team owners and coaches
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReliabilityBadge, getReliabilityScore } from '@/components/ReliabilityBadge';
import { 
  Users, TrendingUp, Trophy, Target, Lock, Unlock, 
  Star, Percent, MapPin, ChevronRight, Loader2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  display_name?: string;
}

interface StrategyWithStats {
  id: string;
  map: string;
  site: string;
  side: string;
  title: string | null;
  locked: boolean;
  created_at: string;
  win_rate: number;
  total_votes: number;
  avg_rating: number;
}

interface TeamStats {
  team_id: string;
  team_name: string;
  total_strategies: number;
  total_matches: number;
  matches_won: number;
  team_win_rate: number;
}

export function CoachDashboard() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [strategies, setStrategies] = useState<StrategyWithStats[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !teamId) return;
    
    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check user's role in team
        const { data: memberData } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', teamId)
          .eq('user_id', user.id)
          .single();
        
        if (!memberData) {
          setError('You are not a member of this team');
          setIsLoading(false);
          return;
        }
        
        setUserRole(memberData.role);
        
        // Load team stats
        const { data: statsData } = await supabase
          .from('team_stats')
          .select('*')
          .eq('team_id', teamId)
          .single();
        
        if (statsData) {
          setTeamStats(statsData);
        }
        
        // Load team strategies with stats
        const { data: stratData } = await supabase
          .from('strategies')
          .select(`
            id, map, site, side, title, locked, created_at
          `)
          .eq('team_id', teamId)
          .order('created_at', { ascending: false });
        
        if (stratData) {
          // Get stats for each strategy
          const { data: statsData } = await supabase
            .from('strategy_stats')
            .select('*')
            .in('strategy_id', stratData.map(s => s.id));
          
          const statsMap = new Map(statsData?.map(s => [s.strategy_id, s]) || []);
          
          const withStats: StrategyWithStats[] = stratData.map(s => ({
            ...s,
            win_rate: statsMap.get(s.id)?.win_rate || 0,
            total_votes: statsMap.get(s.id)?.total_votes || 0,
            avg_rating: statsMap.get(s.id)?.avg_rating || 0,
          }));
          
          setStrategies(withStats);
        }
        
        // Load team members
        const { data: membersData } = await supabase
          .from('team_members')
          .select(`
            id, user_id, role
          `)
          .eq('team_id', teamId);
        
        if (membersData) {
          // Get profiles for members
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', membersData.map(m => m.user_id));
          
          const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);
          
          setMembers(membersData.map(m => ({
            ...m,
            display_name: profileMap.get(m.user_id) || 'Unknown',
          })));
        }
        
      } catch (e) {
        console.error('Failed to load dashboard:', e);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDashboard();
  }, [user, teamId]);

  const toggleStrategyLock = async (strategyId: string, currentLock: boolean) => {
    if (userRole !== 'coach' && userRole !== 'owner') {
      toast.error('Only coaches can lock strategies');
      return;
    }
    
    const { error } = await supabase
      .from('strategies')
      .update({ locked: !currentLock })
      .eq('id', strategyId);
    
    if (error) {
      toast.error('Failed to update strategy');
    } else {
      setStrategies(prev => prev.map(s => 
        s.id === strategyId ? { ...s, locked: !currentLock } : s
      ));
      toast.success(currentLock ? 'Strategy unlocked' : 'Strategy locked');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <p className="text-muted-foreground">Please login to access coach dashboard</p>
        <Button onClick={() => navigate('/autostat')}>Go to AutoStat</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isCoachOrOwner = userRole === 'coach' || userRole === 'owner';
  const bestStrategies = [...strategies].sort((a, b) => b.win_rate - a.win_rate).slice(0, 5);
  const weakStrategies = [...strategies].sort((a, b) => a.win_rate - b.win_rate).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-2xl">{teamStats?.team_name || 'Team'}</h2>
            <Badge variant={isCoachOrOwner ? 'default' : 'secondary'}>
              {userRole?.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Coach Dashboard</p>
        </div>
        {isCoachOrOwner && (
          <Button onClick={() => navigate(`/team/${teamId}/planner`)}>
            Round Planner
          </Button>
        )}
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Win Rate</CardTitle>
            <Percent className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.team_win_rate || 0}%</div>
            <Progress value={teamStats?.team_win_rate || 0} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Strategies</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.total_strategies || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {strategies.filter(s => s.locked).length} locked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
            <Trophy className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats?.total_matches || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {teamStats?.matches_won || 0} won
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {members.filter(m => m.role === 'coach').length} coaches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Strategies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Best Performing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bestStrategies.length > 0 ? (
                  bestStrategies.map(strat => (
                    <div key={strat.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{strat.title || `${strat.map} ${strat.site}`}</span>
                          <span className="text-xs text-muted-foreground">
                            {strat.map} • {strat.side} • {strat.site}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <ReliabilityBadge 
                          winRate={strat.win_rate} 
                          totalUses={strat.total_votes} 
                        />
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-500">{strat.win_rate}%</div>
                          <div className="text-xs text-muted-foreground">{strat.total_votes} uses</div>
                        </div>
                        {isCoachOrOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStrategyLock(strat.id, strat.locked)}
                          >
                            {strat.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No strategies yet</p>
                )}
              </CardContent>
            </Card>

            {/* Weak Strategies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Needs Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {weakStrategies.length > 0 ? (
                  weakStrategies.map(strat => (
                    <div key={strat.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{strat.title || `${strat.map} ${strat.site}`}</span>
                          <span className="text-xs text-muted-foreground">
                            {strat.map} • {strat.side} • {strat.site}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-orange-500">{strat.win_rate}%</div>
                          <div className="text-xs text-muted-foreground">{strat.total_votes} uses</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/strategy/${strat.id}`)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No strategies yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Strategies Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Team Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium">Map</th>
                      <th className="text-left py-3 px-2 text-sm font-medium">Site</th>
                      <th className="text-left py-3 px-2 text-sm font-medium">Side</th>
                      <th className="text-center py-3 px-2 text-sm font-medium">Reliability</th>
                      <th className="text-center py-3 px-2 text-sm font-medium">Win Rate</th>
                      <th className="text-center py-3 px-2 text-sm font-medium">Rating</th>
                      <th className="text-center py-3 px-2 text-sm font-medium">Status</th>
                      <th className="text-right py-3 px-2 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategies.map(strat => (
                      <tr key={strat.id} className="border-b hover:bg-secondary/20">
                        <td className="py-3 px-2">{strat.map}</td>
                        <td className="py-3 px-2">{strat.site}</td>
                        <td className="py-3 px-2 capitalize">{strat.side}</td>
                        <td className="py-3 px-2 text-center">
                          <ReliabilityBadge 
                            winRate={strat.win_rate} 
                            totalUses={strat.total_votes} 
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={strat.win_rate >= 50 ? 'default' : 'secondary'}>
                            {strat.win_rate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {strat.avg_rating || '-'}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          {strat.locked ? (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Editable</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/strategy/${strat.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {strategies.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No strategies yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{member.display_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
