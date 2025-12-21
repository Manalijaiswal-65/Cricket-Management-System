import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Plus,
  Play,
  Maximize2,
  Minimize2,
  Calendar,
  MapPin,
  Zap,
  CheckCircle2,
  Target
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function TournamentDetailPage() {
  const { tournamentId } = useParams();
  const { token, user, isManager, isAdmin } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Dialog states
  const [addTeamDialogOpen, setAddTeamDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [generating, setGenerating] = useState(false);

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket) {
        newSocket.emit('leave_tournament', { tournament_id: tournamentId });
        newSocket.disconnect();
      }
    };
  }, [tournamentId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;
    
    socket.on('connect', () => {
      socket.emit('join_tournament', { tournament_id: tournamentId, user });
    });
    
    socket.on('tournament_viewer_count', (count) => {
      setViewerCount(count);
    });
    
    socket.on('match_update', (matchData) => {
      setMatches(prev => prev.map(m => 
        m.match_id === matchData.match_id ? matchData : m
      ));
    });
    
    socket.on('tournament_update', (data) => {
      if (data.type === 'bracket_generated' || data.type === 'match_completed') {
        fetchTournamentData();
      }
    });
    
    return () => {
      socket.off('connect');
      socket.off('tournament_viewer_count');
      socket.off('match_update');
      socket.off('tournament_update');
    };
  }, [socket, tournamentId, user]);

  const fetchTournamentData = useCallback(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      const [tournamentRes, allTeamsRes] = await Promise.all([
        axios.get(`${API_URL}/api/tournaments/${tournamentId}`, config),
        axios.get(`${API_URL}/api/teams`, config)
      ]);

      setTournament(tournamentRes.data);
      setMatches(tournamentRes.data.matches || []);
      setTeams(tournamentRes.data.team_details || []);
      setAllTeams(allTeamsRes.data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      toast.error('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  }, [tournamentId, token]);

  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  const handleAddTeam = async () => {
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }
    
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/tournaments/${tournamentId}/teams`,
        { team_id: selectedTeam },
        { headers, withCredentials: true }
      );
      toast.success('Team added!');
      setAddTeamDialogOpen(false);
      setSelectedTeam('');
      fetchTournamentData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add team');
    }
  };

  const handleRemoveTeam = async (teamId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(
        `${API_URL}/api/tournaments/${tournamentId}/teams/${teamId}`,
        { headers, withCredentials: true }
      );
      toast.success('Team removed');
      fetchTournamentData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove team');
    }
  };

  const handleGenerateBracket = async () => {
    if (tournament.teams.length < 2) {
      toast.error('Need at least 2 teams to generate bracket');
      return;
    }
    
    setGenerating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/tournaments/${tournamentId}/generate-bracket`,
        {},
        { headers, withCredentials: true }
      );
      toast.success('Bracket generated!');
      fetchTournamentData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate bracket');
    } finally {
      setGenerating(false);
    }
  };

  const getTeamById = (teamId) => teams.find(t => t.team_id === teamId) || allTeams.find(t => t.team_id === teamId);

  const getMatchesByRound = () => {
    const roundMap = {};
    matches.forEach(match => {
      if (!roundMap[match.round]) {
        roundMap[match.round] = [];
      }
      roundMap[match.round].push(match);
    });
    return roundMap;
  };

  const getRoundName = (round, totalRounds) => {
    if (round === totalRounds) return 'Final';
    if (round === totalRounds - 1) return 'Semi-Finals';
    if (round === totalRounds - 2) return 'Quarter-Finals';
    return `Round ${round}`;
  };

  const canManage = (isManager || isAdmin) && 
    (user?.user_id === tournament?.created_by || isAdmin);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tournament) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-chivo text-2xl font-bold mb-4">Tournament Not Found</h2>
          <Link to="/tournaments">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const roundMatches = getMatchesByRound();
  const totalRounds = Math.max(...Object.keys(roundMatches).map(Number), 0);

  // Fullscreen Live Score View
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-background z-50 overflow-auto">
        <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="font-chivo text-2xl sm:text-3xl font-bold">{tournament.name}</h1>
              {tournament.status === 'live' && (
                <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50">
                  <span className="w-2 h-2 rounded-full bg-neon-pink mr-2 pulse-live" />
                  LIVE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {viewerCount} watching
              </Badge>
              <Button variant="outline" size="icon" onClick={() => setIsFullscreen(false)}>
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bracket View */}
          <div className="overflow-x-auto pb-8">
            <div className="flex gap-8 min-w-max">
              {Object.keys(roundMatches).sort((a, b) => a - b).map((round) => (
                <div key={round} className="flex flex-col gap-4 min-w-[280px]">
                  <h3 className="font-chivo font-bold text-center text-lg text-primary">
                    {getRoundName(parseInt(round), totalRounds)}
                  </h3>
                  <div className="flex flex-col justify-around h-full gap-4">
                    {roundMatches[round].map((match) => {
                      const team1 = getTeamById(match.team1_id);
                      const team2 = getTeamById(match.team2_id);
                      
                      return (
                        <Link key={match.match_id} to={`/tournament-matches/${match.match_id}`}>
                          <Card className={`bg-surface border-border/50 hover:border-primary/50 transition-all ${match.status === 'live' ? 'border-neon-pink/50 animate-pulse' : ''}`}>
                            <CardContent className="p-4">
                              {match.status === 'live' && (
                                <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50 mb-2">
                                  <span className="w-2 h-2 rounded-full bg-neon-pink mr-2 pulse-live" />
                                  LIVE
                                </Badge>
                              )}
                              <div className="space-y-3">
                                {/* Team 1 */}
                                <div className={`flex items-center justify-between p-2 rounded ${match.winner_id === match.team1_id ? 'bg-primary/20' : 'bg-muted/30'}`}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                      style={{ 
                                        backgroundColor: (team1?.primary_color || '#4ade80') + '20',
                                        color: team1?.primary_color || '#4ade80'
                                      }}
                                    >
                                      {team1?.short_name || 'TBD'}
                                    </div>
                                    <span className="font-medium text-sm">{team1?.name || 'TBD'}</span>
                                  </div>
                                  {match.innings1 && match.innings1.batting_team_id === match.team1_id && (
                                    <span className="font-mono font-bold text-primary">
                                      {match.innings1.runs}/{match.innings1.wickets}
                                    </span>
                                  )}
                                  {match.innings2 && match.innings2.batting_team_id === match.team1_id && (
                                    <span className="font-mono font-bold">
                                      {match.innings2.runs}/{match.innings2.wickets}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Team 2 */}
                                <div className={`flex items-center justify-between p-2 rounded ${match.winner_id === match.team2_id ? 'bg-primary/20' : 'bg-muted/30'}`}>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                      style={{ 
                                        backgroundColor: (team2?.primary_color || '#3b82f6') + '20',
                                        color: team2?.primary_color || '#3b82f6'
                                      }}
                                    >
                                      {team2?.short_name || 'TBD'}
                                    </div>
                                    <span className="font-medium text-sm">{team2?.name || 'TBD'}</span>
                                  </div>
                                  {match.innings1 && match.innings1.batting_team_id === match.team2_id && (
                                    <span className="font-mono font-bold text-primary">
                                      {match.innings1.runs}/{match.innings1.wickets}
                                    </span>
                                  )}
                                  {match.innings2 && match.innings2.batting_team_id === match.team2_id && (
                                    <span className="font-mono font-bold">
                                      {match.innings2.runs}/{match.innings2.wickets}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {match.result_summary && (
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  {match.result_summary}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {/* Winner */}
              {tournament.winner_id && (
                <div className="flex flex-col gap-4 min-w-[280px]">
                  <h3 className="font-chivo font-bold text-center text-lg text-yellow-500">
                    Champion
                  </h3>
                  <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/50">
                    <CardContent className="p-6 text-center">
                      <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <div 
                        className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-xl font-bold mb-3"
                        style={{ 
                          backgroundColor: (getTeamById(tournament.winner_id)?.primary_color || '#4ade80') + '30',
                          color: getTeamById(tournament.winner_id)?.primary_color || '#4ade80'
                        }}
                      >
                        {getTeamById(tournament.winner_id)?.short_name}
                      </div>
                      <h4 className="font-chivo font-bold text-lg">
                        {getTeamById(tournament.winner_id)?.name}
                      </h4>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="tournament-detail-page">
        <Link to="/tournaments">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournaments
          </Button>
        </Link>

        {/* Tournament Header */}
        <Card className="bg-surface/50 border-border/50">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-chivo text-2xl sm:text-3xl font-bold">{tournament.name}</h1>
                  {tournament.status === 'live' && (
                    <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50">
                      <span className="w-2 h-2 rounded-full bg-neon-pink mr-2 pulse-live" />
                      LIVE
                    </Badge>
                  )}
                  {tournament.status === 'completed' && (
                    <Badge variant="outline" className="text-primary border-primary/50">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 capitalize">
                    <Trophy className="w-4 h-4" />
                    {tournament.sport_type} - {tournament.format}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {tournament.teams?.length || 0} Teams
                  </span>
                  {tournament.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {tournament.venue}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {viewerCount} watching
                </Badge>
                {tournament.status !== 'draft' && (
                  <Button variant="outline" size="icon" onClick={() => setIsFullscreen(true)} data-testid="fullscreen-btn">
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Draft Mode - Team Management */}
        {tournament.status === 'draft' && canManage && (
          <Card className="bg-surface/50 border-border/50">
            <CardHeader>
              <CardTitle className="font-chivo text-lg flex items-center justify-between">
                <span>Teams ({tournament.teams?.length || 0})</span>
                <Button size="sm" onClick={() => setAddTeamDialogOpen(true)} data-testid="add-team-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teams.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {teams.map((team) => (
                    <Card key={team.team_id} className="bg-muted/30 border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                              style={{ 
                                backgroundColor: (team.primary_color || '#4ade80') + '20',
                                color: team.primary_color || '#4ade80'
                              }}
                            >
                              {team.short_name}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{team.name}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => handleRemoveTeam(team.team_id)}
                          >
                            ✕
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No teams added yet. Add teams to generate the bracket.
                </p>
              )}
              
              {tournament.teams?.length >= 2 && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <Button 
                    onClick={handleGenerateBracket} 
                    disabled={generating}
                    className="w-full neon-glow-green"
                    data-testid="generate-bracket-btn"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {generating ? 'Generating...' : 'Generate Bracket & Start Tournament'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bracket View */}
        {tournament.status !== 'draft' && matches.length > 0 && (
          <Card className="bg-surface/50 border-border/50">
            <CardHeader>
              <CardTitle className="font-chivo text-lg">Tournament Bracket</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="flex gap-8 min-w-max pb-4">
                  {Object.keys(roundMatches).sort((a, b) => a - b).map((round) => (
                    <div key={round} className="flex flex-col gap-4 min-w-[260px]">
                      <h3 className="font-chivo font-bold text-center text-primary">
                        {getRoundName(parseInt(round), totalRounds)}
                      </h3>
                      <div className="flex flex-col justify-around h-full gap-4">
                        {roundMatches[round].map((match) => {
                          const team1 = getTeamById(match.team1_id);
                          const team2 = getTeamById(match.team2_id);
                          const matchLink = canManage && (match.status === 'scheduled' || match.status === 'live')
                            ? `/live-scoring/${match.match_id}`
                            : `/tournament-matches/${match.match_id}`;
                          
                          return (
                            <Link key={match.match_id} to={matchLink}>
                              <Card className={`bg-muted/30 border-border/50 hover:border-primary/50 transition-all ${match.status === 'live' ? 'border-neon-pink/50' : ''}`}>
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    {match.status === 'live' && (
                                      <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50 text-xs">
                                        <span className="w-1.5 h-1.5 rounded-full bg-neon-pink mr-1.5 pulse-live" />
                                        LIVE
                                      </Badge>
                                    )}
                                    {match.status === 'scheduled' && canManage && (
                                      <Badge variant="outline" className="text-xs">
                                        <Target className="w-3 h-3 mr-1" />
                                        Start
                                      </Badge>
                                    )}
                                    {match.status === 'completed' && (
                                      <Badge variant="outline" className="text-xs text-primary">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Done
                                      </Badge>
                                    )}
                                    {match.status === 'pending' && (
                                      <Badge variant="outline" className="text-xs text-muted-foreground">
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <div className={`flex items-center justify-between p-2 rounded text-sm ${match.winner_id === match.team1_id ? 'bg-primary/20' : ''}`}>
                                      <span className="font-medium">{team1?.short_name || 'TBD'}</span>
                                      {match.innings1?.batting_team_id === match.team1_id && (
                                        <span className="font-mono text-primary">{match.innings1.runs}/{match.innings1.wickets}</span>
                                      )}
                                      {match.innings2?.batting_team_id === match.team1_id && (
                                        <span className="font-mono">{match.innings2.runs}/{match.innings2.wickets}</span>
                                      )}
                                    </div>
                                    <div className={`flex items-center justify-between p-2 rounded text-sm ${match.winner_id === match.team2_id ? 'bg-primary/20' : ''}`}>
                                      <span className="font-medium">{team2?.short_name || 'TBD'}</span>
                                      {match.innings1?.batting_team_id === match.team2_id && (
                                        <span className="font-mono text-primary">{match.innings1.runs}/{match.innings1.wickets}</span>
                                      )}
                                      {match.innings2?.batting_team_id === match.team2_id && (
                                        <span className="font-mono">{match.innings2.runs}/{match.innings2.wickets}</span>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {/* Winner Display */}
                  {tournament.winner_id && (
                    <div className="flex flex-col gap-4 min-w-[260px]">
                      <h3 className="font-chivo font-bold text-center text-yellow-500">Champion</h3>
                      <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/50">
                        <CardContent className="p-4 text-center">
                          <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                          <h4 className="font-chivo font-bold">
                            {getTeamById(tournament.winner_id)?.name}
                          </h4>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Add Team Dialog */}
        <Dialog open={addTeamDialogOpen} onOpenChange={setAddTeamDialogOpen}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-chivo">Add Team to Tournament</DialogTitle>
              <DialogDescription>
                Select a team to add to this tournament
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {allTeams
                    .filter(t => !tournament.teams?.includes(t.team_id))
                    .map((team) => (
                      <SelectItem key={team.team_id} value={team.team_id}>
                        {team.name} ({team.short_name})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAddTeamDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTeam}>Add Team</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
