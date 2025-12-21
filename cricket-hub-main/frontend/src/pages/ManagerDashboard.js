import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Trophy, 
  Plus, 
  Users,
  User,
  Settings,
  Eye,
  Edit,
  Trash2,
  Play,
  Calendar,
  MapPin,
  Zap,
  CheckCircle2,
  Clock,
  Shield,
  Target
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ManagerDashboard() {
  const { token, user, isManager, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('teams');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [myTeams, setMyTeams] = useState([]);
  const [myTournaments, setMyTournaments] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  
  // Dialog states
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [tournamentDialogOpen, setTournamentDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form states
  const [newTeam, setNewTeam] = useState({
    name: '',
    short_name: '',
    primary_color: '#4ade80',
    secondary_color: '#18181b',
    home_ground: ''
  });
  
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    email: '',
    team_id: '',
    jersey_number: '',
    role: 'batsman',
    batting_style: 'right-hand',
    bowling_style: ''
  });
  
  const [newTournament, setNewTournament] = useState({
    name: '',
    sport_type: 'cricket',
    format: 'knockout',
    venue: '',
    overs: 20,
    start_date: '',
    match_interval_hours: 24
  });

  useEffect(() => {
    if (!isManager && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [isManager, isAdmin, navigate]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const config = { headers, withCredentials: true };

      const [teamsRes, tournamentsRes, playersRes] = await Promise.all([
        axios.get(`${API_URL}/api/teams`, config),
        axios.get(`${API_URL}/api/tournaments`, config),
        axios.get(`${API_URL}/api/players`, config)
      ]);

      // Filter teams managed by current user (or all for admin)
      const managedTeams = isAdmin 
        ? teamsRes.data 
        : teamsRes.data.filter(t => t.manager_id === user?.user_id);
      setMyTeams(managedTeams);

      // Filter tournaments created by current user (or all for admin)
      const createdTournaments = isAdmin
        ? tournamentsRes.data
        : tournamentsRes.data.filter(t => t.created_by === user?.user_id);
      setMyTournaments(createdTournaments);

      // Get players from managed teams
      const teamIds = managedTeams.map(t => t.team_id);
      const teamPlayers = isAdmin
        ? playersRes.data
        : playersRes.data.filter(p => teamIds.includes(p.team_id));
      setAllPlayers(teamPlayers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name || !newTeam.short_name) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setCreating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/teams`, newTeam, { headers, withCredentials: true });
      toast.success('Team created successfully!');
      setTeamDialogOpen(false);
      setNewTeam({
        name: '',
        short_name: '',
        primary_color: '#4ade80',
        secondary_color: '#18181b',
        home_ground: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.name || !newPlayer.team_id || !newPlayer.jersey_number) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setCreating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/players`, {
        ...newPlayer,
        jersey_number: parseInt(newPlayer.jersey_number)
      }, { headers, withCredentials: true });
      toast.success('Player added successfully!');
      setPlayerDialogOpen(false);
      setNewPlayer({
        name: '',
        email: '',
        team_id: '',
        jersey_number: '',
        role: 'batsman',
        batting_style: 'right-hand',
        bowling_style: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add player');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!newTournament.name) {
      toast.error('Please enter tournament name');
      return;
    }
    
    setCreating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`${API_URL}/api/tournaments`, {
        ...newTournament,
        start_date: newTournament.start_date || null
      }, { headers, withCredentials: true });
      toast.success('Tournament created!');
      setTournamentDialogOpen(false);
      // Navigate to tournament detail page to add teams
      navigate(`/tournaments/${response.data.tournament_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team? All players will also be deleted.')) {
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/teams/${teamId}`, { headers, withCredentials: true });
      toast.success('Team deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete team');
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${API_URL}/api/players/${playerId}`, { headers, withCredentials: true });
      toast.success('Player deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete player');
    }
  };

  const getTeamById = (teamId) => myTeams.find(t => t.team_id === teamId);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50">
            <span className="w-2 h-2 rounded-full bg-neon-pink mr-2 pulse-live" />
            LIVE
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Upcoming
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-primary border-primary/50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-chivo text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Manager Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your teams, players, and tournaments
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-surface/50 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myTeams.length}</p>
                  <p className="text-sm text-muted-foreground">My Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface/50 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allPlayers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-surface/50 border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{myTournaments.length}</p>
                  <p className="text-sm text-muted-foreground">Tournaments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-surface border border-border">
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tournaments
            </TabsTrigger>
          </TabsList>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-chivo text-xl font-bold">My Teams</h2>
              <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="neon-glow-green">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface border-border max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-chivo">Create New Team</DialogTitle>
                    <DialogDescription>
                      Add a new team to manage in the league
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTeam} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-name">Team Name *</Label>
                      <Input
                        id="team-name"
                        placeholder="Mumbai Indians"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="short-name">Short Name *</Label>
                      <Input
                        id="short-name"
                        placeholder="MI"
                        maxLength={4}
                        value={newTeam.short_name}
                        onChange={(e) => setNewTeam({ ...newTeam, short_name: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newTeam.primary_color}
                            onChange={(e) => setNewTeam({ ...newTeam, primary_color: e.target.value })}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={newTeam.primary_color}
                            onChange={(e) => setNewTeam({ ...newTeam, primary_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary Color</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={newTeam.secondary_color}
                            onChange={(e) => setNewTeam({ ...newTeam, secondary_color: e.target.value })}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <Input
                            value={newTeam.secondary_color}
                            onChange={(e) => setNewTeam({ ...newTeam, secondary_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Home Ground</Label>
                      <Input
                        placeholder="Wankhede Stadium"
                        value={newTeam.home_ground}
                        onChange={(e) => setNewTeam({ ...newTeam, home_ground: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setTeamDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? 'Creating...' : 'Create Team'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {myTeams.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTeams.map((team) => (
                  <Card key={team.team_id} className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold"
                          style={{ 
                            backgroundColor: team.primary_color + '20',
                            color: team.primary_color
                          }}
                        >
                          {team.short_name}
                        </div>
                        <div className="flex gap-1">
                          <Link to={`/teams/${team.team_id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTeam(team.team_id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-chivo font-bold text-lg">{team.name}</h3>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {allPlayers.filter(p => p.team_id === team.team_id).length} Players
                        </div>
                        {team.home_ground && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {team.home_ground}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          {team.matches_won}W - {team.matches_lost}L ({team.points} pts)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-surface/50 border-border/50">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-chivo text-xl font-bold mb-2">No Teams Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first team to start managing players
                  </p>
                  <Button onClick={() => setTeamDialogOpen(true)} className="neon-glow-green">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-chivo text-xl font-bold">Players</h2>
              <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="neon-glow-green" disabled={myTeams.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Player
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface border-border max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-chivo">Add New Player</DialogTitle>
                    <DialogDescription>
                      Add a player to one of your teams
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePlayer} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Player Name *</Label>
                      <Input
                        placeholder="Virat Kohli"
                        value={newPlayer.name}
                        onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="player@email.com"
                        value={newPlayer.email}
                        onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Team *</Label>
                        <Select
                          value={newPlayer.team_id}
                          onValueChange={(value) => setNewPlayer({ ...newPlayer, team_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {myTeams.map(team => (
                              <SelectItem key={team.team_id} value={team.team_id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Jersey Number *</Label>
                        <Input
                          type="number"
                          placeholder="18"
                          min="0"
                          max="99"
                          value={newPlayer.jersey_number}
                          onChange={(e) => setNewPlayer({ ...newPlayer, jersey_number: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Role *</Label>
                        <Select
                          value={newPlayer.role}
                          onValueChange={(value) => setNewPlayer({ ...newPlayer, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="batsman">Batsman</SelectItem>
                            <SelectItem value="bowler">Bowler</SelectItem>
                            <SelectItem value="all-rounder">All-Rounder</SelectItem>
                            <SelectItem value="wicket-keeper">Wicket Keeper</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Batting Style *</Label>
                        <Select
                          value={newPlayer.batting_style}
                          onValueChange={(value) => setNewPlayer({ ...newPlayer, batting_style: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="right-hand">Right Hand</SelectItem>
                            <SelectItem value="left-hand">Left Hand</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {(newPlayer.role === 'bowler' || newPlayer.role === 'all-rounder') && (
                      <div className="space-y-2">
                        <Label>Bowling Style</Label>
                        <Select
                          value={newPlayer.bowling_style}
                          onValueChange={(value) => setNewPlayer({ ...newPlayer, bowling_style: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bowling style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="right-arm fast">Right Arm Fast</SelectItem>
                            <SelectItem value="left-arm fast">Left Arm Fast</SelectItem>
                            <SelectItem value="right-arm medium">Right Arm Medium</SelectItem>
                            <SelectItem value="left-arm medium">Left Arm Medium</SelectItem>
                            <SelectItem value="right-arm off-spin">Right Arm Off Spin</SelectItem>
                            <SelectItem value="right-arm leg-spin">Right Arm Leg Spin</SelectItem>
                            <SelectItem value="left-arm orthodox">Left Arm Orthodox</SelectItem>
                            <SelectItem value="left-arm chinaman">Left Arm Chinaman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setPlayerDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? 'Adding...' : 'Add Player'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {myTeams.length === 0 ? (
              <Card className="bg-surface/50 border-border/50">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-chivo text-xl font-bold mb-2">Create a Team First</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to create a team before adding players
                  </p>
                  <Button onClick={() => setActiveTab('teams')} variant="outline">
                    Go to Teams
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {myTeams.map((team) => {
                  const teamPlayers = allPlayers.filter(p => p.team_id === team.team_id);
                  
                  return (
                    <Card key={team.team_id} className="bg-surface/50 border-border/50">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ 
                              backgroundColor: team.primary_color + '20',
                              color: team.primary_color
                            }}
                          >
                            {team.short_name}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{team.name}</CardTitle>
                            <CardDescription>{teamPlayers.length} players</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {teamPlayers.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {teamPlayers.map((player) => (
                              <div 
                                key={player.player_id} 
                                className="bg-muted/30 rounded-lg p-4 text-center hover:bg-muted/50 transition-colors group relative"
                              >
                                <button
                                  onClick={() => handleDeletePlayer(player.player_id)}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </button>
                                <div 
                                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2"
                                  style={{ 
                                    backgroundColor: team.primary_color + '30',
                                    color: team.primary_color
                                  }}
                                >
                                  {player.jersey_number}
                                </div>
                                <p className="font-medium text-sm truncate">{player.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{player.role}</p>
                                {player.email && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">{player.email}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No players in this team yet</p>
                            <Button 
                              variant="link" 
                              className="mt-2"
                              onClick={() => {
                                setNewPlayer({ ...newPlayer, team_id: team.team_id });
                                setPlayerDialogOpen(true);
                              }}
                            >
                              Add first player
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-chivo text-xl font-bold">My Tournaments</h2>
              <Dialog open={tournamentDialogOpen} onOpenChange={setTournamentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="neon-glow-green">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tournament
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface border-border max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-chivo">Create New Tournament</DialogTitle>
                    <DialogDescription>
                      Set up a new tournament for your league
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTournament} className="space-y-4">
                    {/* Sport Type Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          newTournament.sport_type === 'cricket' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setNewTournament({ ...newTournament, sport_type: 'cricket' })}
                      >
                        <div className="text-center">
                          <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                          <p className="font-medium">Cricket</p>
                        </div>
                      </div>
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          newTournament.sport_type === 'football' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setNewTournament({ ...newTournament, sport_type: 'football' })}
                      >
                        <div className="text-center">
                          <Zap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                          <p className="font-medium">Football</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tournament Name *</Label>
                      <Input
                        placeholder="Premier League 2024"
                        value={newTournament.name}
                        onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select
                          value={newTournament.format}
                          onValueChange={(value) => setNewTournament({ ...newTournament, format: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="knockout">Knockout</SelectItem>
                            <SelectItem value="round-robin">Round Robin</SelectItem>
                            <SelectItem value="group-knockout">Group + Knockout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newTournament.sport_type === 'cricket' && (
                        <div className="space-y-2">
                          <Label>Overs</Label>
                          <Select
                            value={String(newTournament.overs)}
                            onValueChange={(value) => setNewTournament({ ...newTournament, overs: parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10 Overs</SelectItem>
                              <SelectItem value="20">20 Overs (T20)</SelectItem>
                              <SelectItem value="50">50 Overs (ODI)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input
                        placeholder="Main Stadium"
                        value={newTournament.venue}
                        onChange={(e) => setNewTournament({ ...newTournament, venue: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newTournament.start_date}
                          onChange={(e) => setNewTournament({ ...newTournament, start_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Match Interval (hrs)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={newTournament.match_interval_hours}
                          onChange={(e) => setNewTournament({ ...newTournament, match_interval_hours: parseInt(e.target.value) || 24 })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setTournamentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? 'Creating...' : 'Create & Add Teams'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {myTournaments.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTournaments.map((tournament) => (
                  <Link key={tournament.tournament_id} to={`/tournaments/${tournament.tournament_id}`}>
                    <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          {getStatusBadge(tournament.status)}
                          <Badge variant="outline" className="capitalize">
                            {tournament.sport_type}
                          </Badge>
                        </div>
                        <h3 className="font-chivo font-bold text-lg mb-2">{tournament.name}</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {tournament.teams?.length || 0} Teams
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            {tournament.format}
                          </div>
                          {tournament.venue && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {tournament.venue}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <Button variant="outline" size="sm" className="w-full">
                            {tournament.status === 'draft' ? (
                              <>
                                <Settings className="w-4 h-4 mr-2" />
                                Manage
                              </>
                            ) : tournament.status === 'live' ? (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Live Scoring
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="bg-surface/50 border-border/50">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-chivo text-xl font-bold mb-2">No Tournaments Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first tournament to get started
                  </p>
                  <Button onClick={() => setTournamentDialogOpen(true)} className="neon-glow-green">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tournament
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
