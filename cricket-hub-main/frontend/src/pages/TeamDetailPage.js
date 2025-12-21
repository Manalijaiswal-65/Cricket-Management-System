import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  ArrowLeft, 
  Users, 
  Trophy, 
  Calendar, 
  MapPin,
  TrendingUp,
  Target
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const { token } = useAuth();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      const [teamRes, playersRes] = await Promise.all([
        axios.get(`${API_URL}/api/teams/${teamId}`, config),
        axios.get(`${API_URL}/api/teams/${teamId}/players`, config)
      ]);

      setTeam(teamRes.data);
      setPlayers(playersRes.data);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!team) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-chivo text-2xl font-bold mb-4">Team Not Found</h2>
          <Link to="/teams">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="team-detail-page">
        {/* Back Button */}
        <Link to="/teams">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
        </Link>

        {/* Team Header */}
        <Card className="bg-surface/50 border-border/50 overflow-hidden">
          <div 
            className="h-2"
            style={{ backgroundColor: team.primary_color }}
          />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div 
                className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-bold shrink-0"
                style={{ 
                  backgroundColor: team.primary_color + '20',
                  color: team.primary_color
                }}
              >
                {team.short_name}
              </div>
              <div className="flex-1">
                <h1 className="font-chivo text-2xl sm:text-3xl font-bold mb-2">{team.name}</h1>
                {team.home_ground && (
                  <p className="text-muted-foreground flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4" />
                    {team.home_ground}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{players.length} Players</Badge>
                  <Badge variant="outline">{team.matches_played} Matches</Badge>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8 pt-6 border-t border-border/50">
              <div className="text-center">
                <div className="font-mono text-2xl font-bold">{team.matches_played}</div>
                <div className="text-sm text-muted-foreground">Played</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-primary">{team.matches_won}</div>
                <div className="text-sm text-muted-foreground">Won</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-destructive">{team.matches_lost}</div>
                <div className="text-sm text-muted-foreground">Lost</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold">{team.matches_drawn}</div>
                <div className="text-sm text-muted-foreground">Drawn</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-secondary">{team.points}</div>
                <div className="text-sm text-muted-foreground">Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="bg-surface border border-border">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-4">
            {players.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => (
                  <Link key={player.player_id} to={`/players/${player.player_id}`}>
                    <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ 
                              backgroundColor: team.primary_color + '20',
                              color: team.primary_color
                            }}
                          >
                            #{player.jersey_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{player.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">{player.role}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-lg font-bold text-primary">{player.runs}</div>
                            <div className="text-xs text-muted-foreground">runs</div>
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
                  <h3 className="font-chivo text-xl font-bold mb-2">No Players</h3>
                  <p className="text-muted-foreground">This team has no players yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="bg-surface/50 border-border/50">
                <CardHeader>
                  <CardTitle className="font-chivo text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Batting Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Runs</span>
                      <span className="font-mono font-bold">
                        {players.reduce((sum, p) => sum + p.runs, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Highest Score</span>
                      <span className="font-mono font-bold">
                        {Math.max(...players.map(p => p.highest_score), 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Sixes</span>
                      <span className="font-mono font-bold">
                        {players.reduce((sum, p) => sum + p.sixes, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Fours</span>
                      <span className="font-mono font-bold">
                        {players.reduce((sum, p) => sum + p.fours, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface/50 border-border/50">
                <CardHeader>
                  <CardTitle className="font-chivo text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    Bowling Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Wickets</span>
                      <span className="font-mono font-bold">
                        {players.reduce((sum, p) => sum + p.wickets, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Runs Conceded</span>
                      <span className="font-mono font-bold">
                        {players.reduce((sum, p) => sum + p.runs_conceded, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Catches</span>
                      <span className="font-mono font-bold">
                        {players.reduce((sum, p) => sum + p.catches, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Run Outs</span>
                      <span className="font-mono font-bold">
                        {players.reduce((sum, p) => sum + p.run_outs, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
