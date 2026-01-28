/**
 * Team Management Hook - Team CRUD and member management
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type TeamRole = 'owner' | 'admin' | 'coach' | 'player' | 'viewer';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  invite_code: string;
  created_by: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string; // Database returns string, cast as needed
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: string; // Database returns string, cast as needed
  token: string;
  expires_at: string;
  accepted_at: string | null;
}

export function useTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserTeams = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get teams where user is a member
      const { data: memberData } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id);
      
      if (!memberData?.length) {
        setTeams([]);
        setIsLoading(false);
        return;
      }
      
      const teamIds = memberData.map(m => m.team_id);
      
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds);
      
      if (error) throw error;
      
      setTeams(teamsData || []);
    } catch (e) {
      console.error('Failed to fetch teams:', e);
      toast.error('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchTeam = useCallback(async (teamId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();
      
      if (error) throw error;
      setCurrentTeam(data);
      return data;
    } catch (e) {
      console.error('Failed to fetch team:', e);
      toast.error('Failed to load team');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTeamMembers = useCallback(async (teamId: string) => {
    try {
      const { data: memberData, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);
      
      if (error) throw error;
      
      if (memberData?.length) {
        // Get profiles for display names
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', memberData.map(m => m.user_id));
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const enriched = memberData.map(m => ({
          ...m,
          display_name: profileMap.get(m.user_id)?.display_name || 'Unknown',
          avatar_url: profileMap.get(m.user_id)?.avatar_url,
        }));
        
        setMembers(enriched);
      } else {
        setMembers([]);
      }
    } catch (e) {
      console.error('Failed to fetch members:', e);
    }
  }, []);

  const fetchTeamInvites = useCallback(async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('team_id', teamId)
        .is('accepted_at', null);
      
      if (error) throw error;
      setInvites(data || []);
    } catch (e) {
      console.error('Failed to fetch invites:', e);
    }
  }, []);

  const createTeam = useCallback(async (name: string, description?: string): Promise<string | null> => {
    if (!user) {
      toast.error('Login required');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name,
          description: description || null,
          created_by: user.id,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      toast.success('Team created!');
      await fetchUserTeams();
      return data.id;
    } catch (e) {
      console.error('Failed to create team:', e);
      toast.error('Failed to create team');
      return null;
    }
  }, [user, fetchUserTeams]);

  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId);
      
      if (error) throw error;
      
      setCurrentTeam(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Team updated!');
    } catch (e) {
      console.error('Failed to update team:', e);
      toast.error('Failed to update team');
    }
  }, []);

  const deleteTeam = useCallback(async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);
      
      if (error) throw error;
      
      setTeams(prev => prev.filter(t => t.id !== teamId));
      toast.success('Team deleted');
    } catch (e) {
      console.error('Failed to delete team:', e);
      toast.error('Failed to delete team');
    }
  }, []);

  const inviteMember = useCallback(async (teamId: string, email: string, role: TeamRole = 'player') => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('team_invites')
        .insert({
          team_id: teamId,
          email,
          role,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setInvites(prev => [...prev, data]);
      toast.success(`Invite sent to ${email}`);
      return data;
    } catch (e) {
      console.error('Failed to send invite:', e);
      toast.error('Failed to send invite');
      return null;
    }
  }, [user]);

  const acceptInvite = useCallback(async (inviteToken: string) => {
    if (!user) {
      toast.error('Login required to accept invite');
      return false;
    }
    
    try {
      // Find invite by token
      const { data: invite, error: inviteError } = await supabase
        .from('team_invites')
        .select('*')
        .eq('token', inviteToken)
        .is('accepted_at', null)
        .single();
      
      if (inviteError || !invite) {
        toast.error('Invalid or expired invite');
        return false;
      }
      
      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        toast.error('Invite has expired');
        return false;
      }
      
      // Add as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invite.team_id,
          user_id: user.id,
          role: invite.role,
        });
      
      if (memberError) throw memberError;
      
      // Mark invite as accepted
      await supabase
        .from('team_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id);
      
      toast.success('Welcome to the team!');
      await fetchUserTeams();
      return true;
    } catch (e) {
      console.error('Failed to accept invite:', e);
      toast.error('Failed to join team');
      return false;
    }
  }, [user, fetchUserTeams]);

  const joinByCode = useCallback(async (inviteCode: string) => {
    if (!user) {
      toast.error('Login required');
      return false;
    }
    
    try {
      // Find team by invite code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('invite_code', inviteCode)
        .single();
      
      if (teamError || !team) {
        toast.error('Invalid invite code');
        return false;
      }
      
      // Check if already a member
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        toast.info('You are already a member of this team');
        return true;
      }
      
      // Join as player
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'player' as TeamRole,
        });
      
      if (memberError) throw memberError;
      
      toast.success(`Welcome to ${team.name}!`);
      await fetchUserTeams();
      return true;
    } catch (e) {
      console.error('Failed to join team:', e);
      toast.error('Failed to join team');
      return false;
    }
  }, [user, fetchUserTeams]);

  const updateMemberRole = useCallback(async (memberId: string, role: TeamRole) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId);
      
      if (error) throw error;
      
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
      toast.success('Role updated');
    } catch (e) {
      console.error('Failed to update role:', e);
      toast.error('Failed to update role');
    }
  }, []);

  const removeMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success('Member removed');
    } catch (e) {
      console.error('Failed to remove member:', e);
      toast.error('Failed to remove member');
    }
  }, []);

  const leaveTeam = useCallback(async (teamId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setTeams(prev => prev.filter(t => t.id !== teamId));
      toast.success('Left team');
    } catch (e) {
      console.error('Failed to leave team:', e);
      toast.error('Failed to leave team');
    }
  }, [user]);

  const getUserRole = useCallback(async (teamId: string): Promise<TeamRole | null> => {
    if (!user) return null;
    
    const { data } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    return data?.role as TeamRole | null;
  }, [user]);

  return {
    teams,
    currentTeam,
    members,
    invites,
    isLoading,
    fetchUserTeams,
    fetchTeam,
    fetchTeamMembers,
    fetchTeamInvites,
    createTeam,
    updateTeam,
    deleteTeam,
    inviteMember,
    acceptInvite,
    joinByCode,
    updateMemberRole,
    removeMember,
    leaveTeam,
    getUserRole,
  };
}
