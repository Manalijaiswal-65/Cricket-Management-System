import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
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
import { Trophy, Plus, Search, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PlayersPage() {
  const { token, isAdmin, isManager } = useAuth();
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    team_id: '',
    jersey_number: 1,
    role: 'batsman',
    batting_style: 'right-hand',
    bowling_style: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      const [playersRes, teamsRes] = await Promise.all([
        axios.get(`${API_URL}/api/players`, config),
        axios.get(`${API_URL}/api/teams`, config)
      ]);

      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/players`, newPlayer, { headers, withCredentials: true });
      toast.success('Player created successfully!');
      setDialogOpen(false);
      setNewPlayer({
        name: '',
        team_id: '',
        jersey_number: 1,
        role: 'batsman',
        batting_style: 'right-hand',
        bowling_style: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create player');
    } finally {
      setCreating(false);
    }
  };

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.team_id === teamId);
    return team?.short_name || 'Unknown';
  };

  const getTeamColor = (teamId) => {
    const team = teams.find(t => t.team_id === teamId);
    return team?.primary_color || '#4ade80';
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = filterTeam === 'all' || player.team_id === filterTeam;
    const matchesRole = filterRole === 'all' || player.role === filterRole;
    return matchesSearch && matchesTeam && matchesRole;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="players-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-chivo text-2xl sm:text-3xl font-bold">Players</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all players in the league
            </p>
          </div>

          {(isAdmin || isManager) && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="neon-glow-green" data-testid="create-player-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-chivo">Add New Player</DialogTitle>
                  <DialogDescription>
                    Add a player to a team
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePlayer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Player Name</Label>
                    <Input
                      id="name"
                      placeholder="Virat Kohli"
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                      required
                      data-testid="player-name-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="team">Team</Label>
                      <Select
                        value={newPlayer.team_id}
                        onValueChange={(value) => setNewPlayer({ ...newPlayer, team_id: value })}
                        required
                      >
                        <SelectTrigger data-testid="player-team-select">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.team_id} value={team.team_id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jersey">Jersey Number</Label>
                      <Input
                        id="jersey"
                        type="number"
                        min="1"
                        max="99"
                        value={newPlayer.jersey_number}
                        onChange={(e) => setNewPlayer({ ...newPlayer, jersey_number: parseInt(e.target.value) })}
                        required
                        data-testid="player-jersey-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
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
                          <SelectItem value="all-rounder">All-rounder</SelectItem>
                          <SelectItem value="wicket-keeper">Wicket-keeper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batting">Batting Style</Label>
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

                  {newPlayer.role !== 'batsman' && (
                    <div className="space-y-2">
                      <Label htmlFor="bowling">Bowling Style</Label>
                      <Select
                        value={newPlayer.bowling_style}
                        onValueChange={(value) => setNewPlayer({ ...newPlayer, bowling_style: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bowling style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="right-arm fast">Right-arm Fast</SelectItem>
                          <SelectItem value="left-arm fast">Left-arm Fast</SelectItem>
                          <SelectItem value="right-arm medium">Right-arm Medium</SelectItem>
                          <SelectItem value="left-arm medium">Left-arm Medium</SelectItem>
                          <SelectItem value="right-arm off-spin">Right-arm Off-spin</SelectItem>
                          <SelectItem value="left-arm spin">Left-arm Spin</SelectItem>
                          <SelectItem value="leg-spin">Leg Spin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating || !newPlayer.team_id} data-testid="submit-player-btn">
                      {creating ? 'Creating...' : 'Add Player'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="search-players-input"
            />
          </div>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.team_id} value={team.team_id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="batsman">Batsman</SelectItem>
              <SelectItem value="bowler">Bowler</SelectItem>
              <SelectItem value="all-rounder">All-rounder</SelectItem>
              <SelectItem value="wicket-keeper">Wicket-keeper</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Players Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="bg-surface/50 border-border/50">
                <CardContent className="p-4">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map((player) => (
              <Link key={player.player_id} to={`/players/${player.player_id}`}>
                <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all card-hover h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ 
                          backgroundColor: getTeamColor(player.team_id) + '20',
                          color: getTeamColor(player.team_id)
                        }}
                      >
                        #{player.jersey_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{player.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getTeamName(player.team_id)}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">{player.role}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/50 text-center">
                      <div>
                        <div className="font-mono text-sm font-bold text-primary">{player.runs}</div>
                        <div className="text-xs text-muted-foreground">Runs</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-secondary">{player.wickets}</div>
                        <div className="text-xs text-muted-foreground">Wkts</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold">{player.matches}</div>
                        <div className="text-xs text-muted-foreground">Mat</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-surface/50 border-border/50">
            <CardContent className="p-12 text-center">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-chivo text-xl font-bold mb-2">No Players Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterTeam !== 'all' || filterRole !== 'all'
                  ? 'No players match your filters'
                  : 'Get started by adding players to teams'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
