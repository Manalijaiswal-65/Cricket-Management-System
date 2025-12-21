import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar } from '../components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
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
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MapPin,
  Wand2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, isAdmin } = useAuth();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('status') || 'all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [date, setDate] = useState(new Date());
  const [newMatch, setNewMatch] = useState({
    team1_id: '',
    team2_id: '',
    venue: '',
    match_date: new Date(),
    overs: 20,
    match_type: 'T20'
  });
  const [scheduleSettings, setScheduleSettings] = useState({
    overs: 20,
    venue: 'Main Stadium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      const [matchesRes, teamsRes] = await Promise.all([
        axios.get(`${API_URL}/api/matches`, config),
        axios.get(`${API_URL}/api/teams`, config)
      ]);

      setMatches(matchesRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/api/matches`, {
        ...newMatch,
        match_date: newMatch.match_date.toISOString()
      }, { headers, withCredentials: true });
      toast.success('Match scheduled successfully!');
      setDialogOpen(false);
      setNewMatch({
        team1_id: '',
        team2_id: '',
        venue: '',
        match_date: new Date(),
        overs: 20,
        match_type: 'T20'
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to schedule match');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        `${API_URL}/api/matches/generate-schedule?overs=${scheduleSettings.overs}&venue=${encodeURIComponent(scheduleSettings.venue)}`,
        {},
        { headers, withCredentials: true }
      );
      toast.success(`Generated ${response.data.matches_count} matches!`);
      setGenerateDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate schedule');
    } finally {
      setGenerating(false);
    }
  };

  const getTeam = (teamId) => teams.find(t => t.team_id === teamId);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return (
          <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50">
            <span className="w-2 h-2 rounded-full bg-neon-pink mr-2 pulse-live" />
            LIVE
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-primary border-primary/50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterMatches = (status) => {
    if (status === 'all') return matches;
    return matches.filter(m => m.status === status);
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', value);
    }
    setSearchParams(searchParams);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="matches-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-chivo text-2xl sm:text-3xl font-bold">Matches</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all matches in the league
            </p>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" data-testid="generate-schedule-btn">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto Generate
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface border-border">
                  <DialogHeader>
                    <DialogTitle className="font-chivo">Generate Round-Robin Schedule</DialogTitle>
                    <DialogDescription>
                      Automatically generate matches for all teams
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Overs per Match</Label>
                      <Select
                        value={String(scheduleSettings.overs)}
                        onValueChange={(value) => setScheduleSettings({ ...scheduleSettings, overs: parseInt(value) })}
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
                      <Label>Default Venue</Label>
                      <Input
                        value={scheduleSettings.venue}
                        onChange={(e) => setScheduleSettings({ ...scheduleSettings, venue: e.target.value })}
                        placeholder="Main Stadium"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This will generate matches starting 7 days from now. Each team will play against every other team once.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateSchedule} disabled={generating}>
                      {generating ? 'Generating...' : 'Generate Schedule'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="neon-glow-green" data-testid="create-match-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Match
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-surface border-border max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-chivo">Schedule New Match</DialogTitle>
                    <DialogDescription>
                      Create a new match between two teams
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateMatch} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Team 1</Label>
                        <Select
                          value={newMatch.team1_id}
                          onValueChange={(value) => setNewMatch({ ...newMatch, team1_id: value })}
                        >
                          <SelectTrigger data-testid="team1-select">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.filter(t => t.team_id !== newMatch.team2_id).map((team) => (
                              <SelectItem key={team.team_id} value={team.team_id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Team 2</Label>
                        <Select
                          value={newMatch.team2_id}
                          onValueChange={(value) => setNewMatch({ ...newMatch, team2_id: value })}
                        >
                          <SelectTrigger data-testid="team2-select">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.filter(t => t.team_id !== newMatch.team1_id).map((team) => (
                              <SelectItem key={team.team_id} value={team.team_id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Venue</Label>
                      <Input
                        placeholder="Main Stadium"
                        value={newMatch.venue}
                        onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}
                        required
                        data-testid="venue-input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Match Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {format(newMatch.match_date, 'PPP')}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={newMatch.match_date}
                              onSelect={(date) => date && setNewMatch({ ...newMatch, match_date: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>Overs</Label>
                        <Select
                          value={String(newMatch.overs)}
                          onValueChange={(value) => setNewMatch({ 
                            ...newMatch, 
                            overs: parseInt(value),
                            match_type: value === '20' ? 'T20' : value === '50' ? 'ODI' : 'Custom'
                          })}
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
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={creating || !newMatch.team1_id || !newMatch.team2_id}
                        data-testid="submit-match-btn"
                      >
                        {creating ? 'Creating...' : 'Schedule Match'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="bg-surface border border-border">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="live">
              <Zap className="w-3 h-3 mr-1" />
              Live
            </TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {['all', 'live', 'scheduled', 'completed'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-surface/50 border-border/50">
                      <CardContent className="p-6">
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filterMatches(status).length > 0 ? (
                <div className="space-y-4">
                  {filterMatches(status).map((match) => {
                    const team1 = getTeam(match.team1_id);
                    const team2 = getTeam(match.team2_id);
                    
                    return (
                      <Link key={match.match_id} to={`/matches/${match.match_id}`}>
                        <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all card-hover mb-4">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              {getStatusBadge(match.status)}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarIcon className="w-4 h-4" />
                                {new Date(match.match_date).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                                  style={{ 
                                    backgroundColor: (team1?.primary_color || '#4ade80') + '20',
                                    color: team1?.primary_color || '#4ade80'
                                  }}
                                >
                                  {team1?.short_name || 'T1'}
                                </div>
                                <div>
                                  <div className="font-medium">{team1?.name || 'Team 1'}</div>
                                  {match.status !== 'scheduled' && match.innings1 && (
                                    <div className="font-mono text-xl font-bold text-primary">
                                      {match.innings1.runs}/{match.innings1.wickets}
                                      <span className="text-sm text-muted-foreground ml-2">
                                        ({match.innings1.overs} ov)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-center px-4">
                                <div className="text-sm text-muted-foreground">vs</div>
                                <div className="text-xs text-muted-foreground mt-1">{match.match_type}</div>
                              </div>

                              <div className="flex items-center gap-4 flex-1 justify-end">
                                <div className="text-right">
                                  <div className="font-medium">{team2?.name || 'Team 2'}</div>
                                  {match.status !== 'scheduled' && match.innings2 && (
                                    <div className="font-mono text-xl font-bold">
                                      {match.innings2.runs}/{match.innings2.wickets}
                                      <span className="text-sm text-muted-foreground ml-2">
                                        ({match.innings2.overs} ov)
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div 
                                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                                  style={{ 
                                    backgroundColor: (team2?.primary_color || '#3b82f6') + '20',
                                    color: team2?.primary_color || '#3b82f6'
                                  }}
                                >
                                  {team2?.short_name || 'T2'}
                                </div>
                              </div>
                            </div>

                            {match.result_summary && (
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-sm text-muted-foreground text-center">{match.result_summary}</p>
                              </div>
                            )}

                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {match.venue}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-surface/50 border-border/50">
                  <CardContent className="p-12 text-center">
                    <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-chivo text-xl font-bold mb-2">No Matches Found</h3>
                    <p className="text-muted-foreground">
                      {status === 'all' 
                        ? 'No matches have been scheduled yet'
                        : `No ${status} matches at the moment`}
                    </p>
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
