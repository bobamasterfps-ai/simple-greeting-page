/**
 * Team Management Page - Create, join, and manage teams
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTeams, Team, TeamMember } from '@/hooks/useTeams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Link as LinkIcon,
  Copy,
  UserPlus,
  Crown,
  Shield,
  Gamepad,
  Eye,
  Trash2,
  Settings,
  Loader2,
  LogOut,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthModal } from '@/components/AuthModal';

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  coach: Shield,
  player: Gamepad,
  viewer: Eye,
};

const ROLE_COLORS = {
  owner: 'text-yellow-500',
  admin: 'text-blue-500',
  coach: 'text-purple-500',
  player: 'text-green-500',
  viewer: 'text-muted-foreground',
};

export function TeamsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    teams,
    isLoading,
    fetchUserTeams,
    createTeam,
    joinByCode,
    acceptInvite,
  } = useTeams();

  const [showAuth, setShowAuth] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle invite token in URL
  useEffect(() => {
    const inviteToken = searchParams.get('invite');
    if (inviteToken && user) {
      acceptInvite(inviteToken).then((success) => {
        if (success) {
          navigate('/teams', { replace: true });
        }
      });
    } else if (inviteToken && !user) {
      setShowAuth(true);
    }
  }, [searchParams, user, acceptInvite, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserTeams();
    }
  }, [user, fetchUserTeams]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    setIsSubmitting(true);
    const teamId = await createTeam(teamName, teamDescription);
    setIsSubmitting(false);

    if (teamId) {
      setShowCreateDialog(false);
      setTeamName('');
      setTeamDescription('');
      navigate(`/team/${teamId}`);
    }
  };

  const handleJoinTeam = async () => {
    if (!inviteCode.trim()) {
      toast.error('Enter an invite code');
      return;
    }

    setIsSubmitting(true);
    const success = await joinByCode(inviteCode.trim());
    setIsSubmitting(false);

    if (success) {
      setShowJoinDialog(false);
      setInviteCode('');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="font-display font-bold text-2xl mb-2">Team Management</h2>
          <p className="text-muted-foreground max-w-md">
            Create or join a team to collaborate on strategies, share lineups, and coordinate with your squad.
          </p>
        </div>
        <Button onClick={() => setShowAuth(true)}>
          Login to Continue
        </Button>
        <AuthModal open={showAuth} onOpenChange={setShowAuth} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">My Teams</h2>
          <p className="text-sm text-muted-foreground">
            Manage your teams and collaborate on strategies
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LinkIcon className="w-4 h-4 mr-2" />
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    placeholder="Enter invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleJoinTeam}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Join Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="e.g., Team Phoenix"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description (optional)</Label>
                  <Input
                    id="team-description"
                    placeholder="Brief description of your team"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateTeam}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Create your own team or join an existing one using an invite code.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowJoinDialog(true)}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Join Team
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  const navigate = useNavigate();
  const { getUserRole, members, fetchTeamMembers } = useTeams();
  const [role, setRole] = useState<string | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    getUserRole(team.id).then(setRole);
    fetchTeamMembers(team.id).then(() => {
      // Member count will be set from the hook
    });
  }, [team.id, getUserRole, fetchTeamMembers]);

  const RoleIcon = role ? ROLE_ICONS[role as keyof typeof ROLE_ICONS] : Users;

  return (
    <Card
      className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
      onClick={() => navigate(`/team/${team.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={team.logo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {team.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{team.name}</CardTitle>
              {role && (
                <Badge variant="secondary" className="mt-1 gap-1">
                  <RoleIcon className={`w-3 h-3 ${ROLE_COLORS[role as keyof typeof ROLE_COLORS]}`} />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {team.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {team.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Members
          </span>
          <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
