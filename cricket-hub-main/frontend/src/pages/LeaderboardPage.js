import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { Trophy, Target, TrendingUp } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function LeaderboardPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [battingLeaders, setBattingLeaders] = useState([]);
  const [bowlingLeaders, setBowlingLeaders] = useState([]);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      const [standingsRes, battingRes, bowlingRes] = await Promise.all([
        axios.get(`${API_URL}/api/stats/standings`, config),
        axios.get(`${API_URL}/api/stats/leaderboard/batting?limit=10`, config),
        axios.get(`${API_URL}/api/stats/leaderboard/bowling?limit=10`, config)
      ]);

      setStandings(standingsRes.data);
      setBattingLeaders(battingRes.data);
      setBowlingLeaders(bowlingRes.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="leaderboard-page">
        <div>
          <h1 className="font-chivo text-2xl sm:text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">
            League standings and player statistics
          </p>
        </div>

        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="bg-surface border border-border">
            <TabsTrigger value="standings">
              <Trophy className="w-4 h-4 mr-2" />
              Standings
            </TabsTrigger>
            <TabsTrigger value="batting">
              <Target className="w-4 h-4 mr-2" />
              Top Batters
            </TabsTrigger>
            <TabsTrigger value="bowling">
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Bowlers
            </TabsTrigger>
          </TabsList>

          {/* Team Standings */}
          <TabsContent value="standings">
            <Card className="bg-surface/50 border-border/50">
              <CardHeader>
                <CardTitle className="font-chivo text-lg">League Table</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : standings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead className="text-center">P</TableHead>
                          <TableHead className="text-center">W</TableHead>
                          <TableHead className="text-center">L</TableHead>
                          <TableHead className="text-center">D</TableHead>
                          <TableHead className="text-center">NRR</TableHead>
                          <TableHead className="text-center">Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {standings.map((team, idx) => (
                          <TableRow key={team.team_id} className="hover:bg-muted/30">
                            <TableCell className={`font-mono font-bold ${idx < 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                              {team.position}
                            </TableCell>
                            <TableCell>
                              <Link to={`/teams/${team.team_id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                  {team.short_name}
                                </div>
                                <span className="font-medium hidden sm:inline">{team.name}</span>
                                <span className="font-medium sm:hidden">{team.short_name}</span>
                              </Link>
                            </TableCell>
                            <TableCell className="text-center font-mono">{team.matches_played}</TableCell>
                            <TableCell className="text-center font-mono text-primary">{team.won}</TableCell>
                            <TableCell className="text-center font-mono text-destructive">{team.lost}</TableCell>
                            <TableCell className="text-center font-mono">{team.drawn}</TableCell>
                            <TableCell className="text-center font-mono">{team.nrr.toFixed(3)}</TableCell>
                            <TableCell className="text-center font-mono font-bold text-primary">{team.points}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No standings data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batting Leaderboard */}
          <TabsContent value="batting">
            <Card className="bg-surface/50 border-border/50">
              <CardHeader>
                <CardTitle className="font-chivo text-lg">Top Run Scorers</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : battingLeaders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-center">M</TableHead>
                          <TableHead className="text-center">Runs</TableHead>
                          <TableHead className="text-center">HS</TableHead>
                          <TableHead className="text-center">Avg</TableHead>
                          <TableHead className="text-center">SR</TableHead>
                          <TableHead className="text-center">4s</TableHead>
                          <TableHead className="text-center">6s</TableHead>
                          <TableHead className="text-center">50s</TableHead>
                          <TableHead className="text-center">100s</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {battingLeaders.map((player, idx) => (
                          <TableRow key={player.player_id} className="hover:bg-muted/30">
                            <TableCell className={`font-mono font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <Link to={`/players/${player.player_id}`} className="font-medium hover:text-primary transition-colors">
                                {player.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center font-mono">{player.matches}</TableCell>
                            <TableCell className="text-center font-mono font-bold text-primary">{player.runs}</TableCell>
                            <TableCell className="text-center font-mono">{player.highest_score}</TableCell>
                            <TableCell className="text-center font-mono">{player.average}</TableCell>
                            <TableCell className="text-center font-mono">{player.strike_rate}</TableCell>
                            <TableCell className="text-center font-mono">{player.fours}</TableCell>
                            <TableCell className="text-center font-mono">{player.sixes}</TableCell>
                            <TableCell className="text-center font-mono">{player.fifties}</TableCell>
                            <TableCell className="text-center font-mono">{player.hundreds}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No batting statistics available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bowling Leaderboard */}
          <TabsContent value="bowling">
            <Card className="bg-surface/50 border-border/50">
              <CardHeader>
                <CardTitle className="font-chivo text-lg">Top Wicket Takers</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : bowlingLeaders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-center">M</TableHead>
                          <TableHead className="text-center">Wkts</TableHead>
                          <TableHead className="text-center">Overs</TableHead>
                          <TableHead className="text-center">Runs</TableHead>
                          <TableHead className="text-center">Avg</TableHead>
                          <TableHead className="text-center">Econ</TableHead>
                          <TableHead className="text-center">Best</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bowlingLeaders.map((player, idx) => (
                          <TableRow key={player.player_id} className="hover:bg-muted/30">
                            <TableCell className={`font-mono font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <Link to={`/players/${player.player_id}`} className="font-medium hover:text-primary transition-colors">
                                {player.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-center font-mono">{player.matches}</TableCell>
                            <TableCell className="text-center font-mono font-bold text-secondary">{player.wickets}</TableCell>
                            <TableCell className="text-center font-mono">{player.overs}</TableCell>
                            <TableCell className="text-center font-mono">{player.runs_conceded}</TableCell>
                            <TableCell className="text-center font-mono">{player.average}</TableCell>
                            <TableCell className="text-center font-mono">{player.economy}</TableCell>
                            <TableCell className="text-center font-mono">{player.best_bowling}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No bowling statistics available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
