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
import { Users, Plus, Search, Trophy, MapPin } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function TeamsPage() {
  const { token, isAdmin, isManager } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    short_name: '',
    primary_color: '#4ade80',
    secondary_color: '#18181b',
    home_ground: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/teams`, { headers, withCredentials: true });
      setTeams(response.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setCreating(true);
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/teams`, newTeam, { headers, withCredentials: true });
      toast.success('Team created successfully!');
      setDialogOpen(false);
      setNewTeam({
        name: '',
        short_name: '',
        primary_color: '#4ade80',
        secondary_color: '#18181b',
        home_ground: ''
      });
      fetchTeams();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.short_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="teams-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-chivo text-2xl sm:text-3xl font-bold">Teams</h1>
            <p className="text-muted-foreground mt-1">
              Manage all teams in the league
            </p>
          </div>
          
          {(isAdmin || isManager) && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="neon-glow-green" data-testid="create-team-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-surface border-border">
                <DialogHeader>
                  <DialogTitle className="font-chivo">Create New Team</DialogTitle>
                  <DialogDescription>
                    Add a new team to the league
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      placeholder="Mumbai Indians"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      required
                      data-testid="team-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="short_name">Short Name</Label>
                    <Input
                      id="short_name"
                      placeholder="MI"
                      maxLength={4}
                      value={newTeam.short_name}
                      onChange={(e) => setNewTeam({ ...newTeam, short_name: e.target.value.toUpperCase() })}
                      required
                      data-testid="team-short-name-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="primary_color"
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
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="secondary_color"
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
                    <Label htmlFor="home_ground">Home Ground</Label>
                    <Input
                      id="home_ground"
                      placeholder="Wankhede Stadium"
                      value={newTeam.home_ground}
                      onChange={(e) => setNewTeam({ ...newTeam, home_ground: e.target.value })}
                      data-testid="team-home-ground-input"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating} data-testid="submit-team-btn">
                      {creating ? 'Creating...' : 'Create Team'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-teams-input"
          />
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-surface/50 border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTeams.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map((team) => (
              <Link key={team.team_id} to={`/teams/${team.team_id}`}>
                <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all card-hover h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold"
                        style={{ 
                          backgroundColor: team.primary_color + '20',
                          color: team.primary_color
                        }}
                      >
                        {team.short_name}
                      </div>
                      <Badge variant="secondary" className="bg-muted">
                        {team.matches_played} matches
                      </Badge>
                    </div>
                    <h3 className="font-chivo font-bold text-lg mb-2">{team.name}</h3>
                    {team.home_ground && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {team.home_ground}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="font-mono text-lg font-bold text-primary">{team.matches_won}</div>
                        <div className="text-xs text-muted-foreground">Won</div>
                      </div>
                      <div>
                        <div className="font-mono text-lg font-bold">{team.matches_lost}</div>
                        <div className="text-xs text-muted-foreground">Lost</div>
                      </div>
                      <div>
                        <div className="font-mono text-lg font-bold text-secondary">{team.points}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
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
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-chivo text-xl font-bold mb-2">No Teams Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No teams match your search' : 'Get started by creating your first team'}
              </p>
              {(isAdmin || isManager) && !searchQuery && (
                <Button onClick={() => setDialogOpen(true)} className="neon-glow-green">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
