/**
 * Team Detail Page - View team, manage members, share invite
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTeams, TeamMember } from '@/hooks/useTeams';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Settings,
  Copy,
  UserPlus,
  Crown,
  Shield,
  Gamepad,
  Eye,
  Trash2,
  Loader2,
  LogOut,
  Check,
  ArrowLeft,
  Mail,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';

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

const ROLES = ['admin', 'coach', 'player', 'viewer'] as const;

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentTeam,
    members,
    invites,
    fetchTeam,
    fetchTeamMembers,
    fetchTeamInvites,
    inviteMember,
    updateMemberRole,
    removeMember,
    leaveTeam,
    deleteTeam,
    getUserRole,
  } = useTeams();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<typeof ROLES[number]>('player');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    async function load() {
      setIsLoading(true);
      await Promise.all([
        fetchTeam(teamId),
        fetchTeamMembers(teamId),
        fetchTeamInvites(teamId),
      ]);
      const role = await getUserRole(teamId);
      setUserRole(role);
      setIsLoading(false);
    }

    load();
  }, [teamId, fetchTeam, fetchTeamMembers, fetchTeamInvites, getUserRole]);

  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  const copyInviteLink = () => {
    if (!currentTeam) return;
    const link = `${window.location.origin}/teams?code=${currentTeam.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Invite link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteCode = () => {
    if (!currentTeam) return;
    navigator.clipboard.writeText(currentTeam.invite_code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async () => {
    if (!inviteEmail || !teamId) return;
    await inviteMember(teamId, inviteEmail, inviteRole);
    setShowInviteDialog(false);
    setInviteEmail('');
  };

  const handleLeave = async () => {
    if (!teamId) return;
    await leaveTeam(teamId);
    navigate('/teams');
  };

  const handleDelete = async () => {
    if (!teamId) return;
    await deleteTeam(teamId);
    navigate('/teams');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Team not found</p>
        <Button variant="outline" onClick={() => navigate('/teams')}>
          Back to Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-14 h-14">
            <AvatarImage src={currentTeam.logo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {currentTeam.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display font-bold text-2xl">{currentTeam.name}</h2>
            {currentTeam.description && (
              <p className="text-sm text-muted-foreground">{currentTeam.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'owner' || userRole === 'admin' || userRole === 'coach' ? (
            <Button variant="outline" onClick={() => navigate(`/coach/${teamId}`)}>
              Coach Dashboard
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          {isAdminOrOwner && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Invite Section */}
          {isAdminOrOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Invite Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Invite Code
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentTeam.invite_code}
                        readOnly
                        className="font-mono"
                      />
                      <Button variant="outline" size="icon" onClick={copyInviteCode}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={copyInviteLink}>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email Invite
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite by Email</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Email Address</Label>
                          <Input
                            type="email"
                            placeholder="teammate@email.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof ROLES[number])}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role.charAt(0).toUpperCase() + role.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full" onClick={handleInvite}>
                          Send Invite
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    currentUserId={user?.id}
                    isAdminOrOwner={isAdminOrOwner}
                    isOwner={isOwner}
                    onUpdateRole={(role: string) => updateMemberRole(member.id, role as 'owner' | 'admin' | 'coach' | 'player' | 'viewer')}
                    onRemove={() => removeMember(member.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdminOrOwner && (
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Team Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage team settings and permissions.
                </p>

                <div className="flex gap-2">
                  {!isOwner && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline">
                          <LogOut className="w-4 h-4 mr-2" />
                          Leave Team
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Leave Team?</AlertDialogTitle>
                          <AlertDialogDescription>
                            You will lose access to team strategies and features.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleLeave}>Leave</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {isOwner && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Team
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Team?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the team and all associated data.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface MemberRowProps {
  member: TeamMember;
  currentUserId?: string;
  isAdminOrOwner: boolean;
  isOwner: boolean;
  onUpdateRole: (role: string) => void;
  onRemove: () => void;
}

function MemberRow({
  member,
  currentUserId,
  isAdminOrOwner,
  isOwner,
  onUpdateRole,
  onRemove,
}: MemberRowProps) {
  const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS] || Users;
  const isMe = member.user_id === currentUserId;
  const canModify = isAdminOrOwner && !isMe && member.role !== 'owner';
  const canRemove = (isOwner && member.role !== 'owner') || (isAdminOrOwner && member.role !== 'owner' && member.role !== 'admin');

  return (
    <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={member.avatar_url} />
          <AvatarFallback>
            {(member.display_name || 'U').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">
            {member.display_name || 'Unknown'}
            {isMe && <span className="text-muted-foreground ml-1">(You)</span>}
          </p>
          <div className="flex items-center gap-1 text-sm">
            <RoleIcon className={`w-3 h-3 ${ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]}`} />
            <span className="capitalize">{member.role}</span>
          </div>
        </div>
      </div>

      {canModify && (
        <div className="flex items-center gap-2">
          <Select value={member.role} onValueChange={(v) => onUpdateRole(v as 'admin' | 'coach' | 'player' | 'viewer')}>
            <SelectTrigger className="w-[110px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canRemove && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {member.display_name} will be removed from the team.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove} className="bg-destructive">
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}
