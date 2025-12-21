import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
  Calendar,
  Users,
  Zap,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function TournamentsPage() {
  const { token, isManager, isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [newTournament, setNewTournament] = useState({
    name: '',
    sport_type: 'cricket',
    format: 'knockout',
    venue: '',
    overs: 20,
    match_interval_hours: 24
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/api/tournaments`, { headers, withCredentials: true });
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
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
      const response = await axios.post(`${API_URL}/api/tournaments`, newTournament, { headers, withCredentials: true });
      toast.success('Tournament created!');
      setDialogOpen(false);
      setNewTournament({
        name: '',
        sport_type: 'cricket',
        format: 'knockout',
        venue: '',
        overs: 20,
        match_interval_hours: 24
      });
      fetchTournaments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

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

  const filterTournaments = (status) => {
    if (status === 'all') return tournaments;
    return tournaments.filter(t => t.status === status);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="tournaments-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-chivo text-2xl sm:text-3xl font-bold">Tournaments</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage cricket & football tournaments
            </p>
          </div>

          {(isManager || isAdmin) && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="neon-glow-green" data-testid="create-tournament-btn">
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
                  <div className="space-y-2">
                    <Label htmlFor="name">Tournament Name</Label>
                    <Input
                      id="name"
                      placeholder="Premier League 2024"
                      value={newTournament.name}
                      onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                      required
                      data-testid="tournament-name-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sport Type</Label>
                      <Select
                        value={newTournament.sport_type}
                        onValueChange={(value) => setNewTournament({ ...newTournament, sport_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cricket">Cricket</SelectItem>
                          <SelectItem value="football">Football</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue">Default Venue</Label>
                    <Input
                      id="venue"
                      placeholder="Main Stadium"
                      value={newTournament.venue}
                      onChange={(e) => setNewTournament({ ...newTournament, venue: e.target.value })}
                    />
                  </div>

                  {newTournament.sport_type === 'cricket' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Overs per Match</Label>
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
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating} data-testid="submit-tournament-btn">
                      {creating ? 'Creating...' : 'Create Tournament'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Sport Type Selection Cards */}
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-3">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-chivo font-bold">Cricket</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tournaments.filter(t => t.sport_type === 'cricket').length} tournaments
              </p>
            </CardContent>
          </Card>
          <Card className="bg-surface/50 border-border/50 hover:border-secondary/50 transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-xl bg-secondary/20 flex items-center justify-center mb-3">
                <Trophy className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-chivo font-bold">Football</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tournaments.filter(t => t.sport_type === 'football').length} tournaments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-surface border border-border">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="live">
              <Zap className="w-3 h-3 mr-1" />
              Live
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {['all', 'live', 'upcoming', 'draft', 'completed'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4 mt-6">
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-surface/50 border-border/50">
                      <CardContent className="p-6">
                        <Skeleton className="h-32 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filterTournaments(status).length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterTournaments(status).map((tournament) => (
                    <Link key={tournament.tournament_id} to={`/tournaments/${tournament.tournament_id}`}>
                      <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all card-hover h-full">
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
                                <Calendar className="w-4 h-4" />
                                {tournament.venue}
                              </div>
                            )}
                          </div>
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <Button variant="outline" size="sm" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              {tournament.status === 'draft' ? 'Edit' : 'View'} Tournament
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
                    <h3 className="font-chivo text-xl font-bold mb-2">No Tournaments Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {status === 'all' 
                        ? 'Get started by creating your first tournament'
                        : `No ${status} tournaments at the moment`}
                    </p>
                    {(isManager || isAdmin) && status === 'all' && (
                      <Button onClick={() => setDialogOpen(true)} className="neon-glow-green">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Tournament
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
