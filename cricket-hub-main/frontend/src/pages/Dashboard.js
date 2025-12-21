import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import EventOverlay from '../components/EventOverlay';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Trophy,
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    teams: 0,
    players: 0,
    upcomingMatches: 0,
    liveMatches: 0
  });
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});

  // Socket state for live updates
  const [socket, setSocket] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const prevMatchesRef = useRef({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Initialize Socket.IO for live matches
  useEffect(() => {
    if (liveMatches.length === 0) return;

    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, [liveMatches.length]);

  // Join match rooms and listen for updates
  useEffect(() => {
    if (!socket || liveMatches.length === 0) return;

    // Join all live match rooms
    liveMatches.forEach(match => {
      socket.emit('join_match', { match_id: match.match_id, user });
      // Store initial state
      prevMatchesRef.current[match.match_id] = match;
    });

    socket.on('score_update', (matchData) => {
      // Update live matches list
      setLiveMatches(prev => prev.map(m => m.match_id === matchData.match_id ? matchData : m));

      // Detect events
      const prevMatch = prevMatchesRef.current[matchData.match_id];
      if (prevMatch) {
        const prevInnings = prevMatch.innings2?.status === 'in_progress' ? prevMatch.innings2 : prevMatch.innings1;
        const currentInningsData = matchData.innings2?.status === 'in_progress' ? matchData.innings2 : matchData.innings1;

        if (prevInnings && currentInningsData) {
          const runsDiff = (currentInningsData.runs || 0) - (prevInnings.runs || 0);
          const wicketsDiff = (currentInningsData.wickets || 0) - (prevInnings.wickets || 0);
          const extrasDiff = (currentInningsData.extras || 0) - (prevInnings.extras || 0);

          // Check for significant events only on dashboard to avoid spam
          if (matchData.status === 'completed' && prevMatch.status !== 'completed') {
            const winnerTeamId = matchData.winner_id;
            setCurrentEvent({
              type: 'winning',
              winner: teamsMap[winnerTeamId]?.name || 'Winner'
            });
          }
          else if (wicketsDiff > 0) {
            setCurrentEvent({ type: 'wicket' });
          }
          else if (runsDiff === 6 && extrasDiff === 0) {
            setCurrentEvent({ type: 'six' });
          }
          else if (runsDiff === 4 && extrasDiff === 0) {
            setCurrentEvent({ type: 'four' });
          }
        }
      }

      prevMatchesRef.current[matchData.match_id] = matchData;
    });

    return () => {
      socket.off('score_update');
    };
  }, [socket, liveMatches, user, teamsMap]);

  const fetchDashboardData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      // Fetch teams first
      const teamsRes = await axios.get(`${API_URL}/api/teams`, config);

      // Create a map of team_id to team data
      const teamMap = {};
      if (teamsRes.data && Array.isArray(teamsRes.data)) {
        teamsRes.data.forEach(team => {
          if (team.team_id) {
            teamMap[team.team_id] = team;
          }
        });
      }
      setTeamsMap(teamMap);
      console.log('Teams Map populated:', Object.keys(teamMap).length, 'teams'); // Debug log

      // Then fetch other data
      const [playersRes, liveRes, upcomingRes, standingsRes, battingRes] = await Promise.all([
        axios.get(`${API_URL}/api/players`, config),
        axios.get(`${API_URL}/api/matches/live`, config),
        axios.get(`${API_URL}/api/matches/upcoming`, config),
        axios.get(`${API_URL}/api/stats/standings`, config),
        axios.get(`${API_URL}/api/stats/leaderboard/batting?limit=5`, config)
      ]);

      setStats({
        teams: teamsRes.data.length,
        players: playersRes.data.length,
        liveMatches: liveRes.data.length,
        upcomingMatches: upcomingRes.data.length
      });

      console.log('Live matches:', liveRes.data); // Debug
      console.log('Upcoming matches:', upcomingRes.data); // Debug

      setLiveMatches(liveRes.data);
      setUpcomingMatches(upcomingRes.data.slice(0, 3));
      setStandings(standingsRes.data.slice(0, 5));
      setTopScorers(battingRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get team name and short name
  const getTeamName = (teamId) => {
    if (!teamId) return 'TBA';
    const team = teamsMap[teamId];
    if (!team) {
      console.warn(`Team not found for ID: ${teamId}, available IDs:`, Object.keys(teamsMap));
    }
    return team?.name || 'TBA';
  };

  const getTeamShortName = (teamId) => {
    if (!teamId) return 'TBA';
    const team = teamsMap[teamId];
    if (!team?.short_name && !team?.name) {
      console.warn(`No name data for team ID: ${teamId}`);
    }
    return team?.short_name || team?.name?.substring(0, 3).toUpperCase() || 'TBA';
  };

  const StatCard = ({ title, value, icon: Icon, color, href }) => (
    <Link to={href}>
      <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all card-hover cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="font-mono text-3xl font-bold">{loading ? <Skeleton className="h-9 w-16" /> : value}</p>
            </div>
            <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="dashboard">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-chivo text-2xl sm:text-3xl font-bold">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening in your league today.
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Link to="/matches">
              <Button className="neon-glow-green" data-testid="new-match-btn">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Match
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Teams"
            value={stats.teams}
            icon={Users}
            color="bg-primary/20 text-primary"
            href="/teams"
          />
          <StatCard
            title="Total Players"
            value={stats.players}
            icon={Trophy}
            color="bg-secondary/20 text-secondary"
            href="/players"
          />
          <StatCard
            title="Live Matches"
            value={stats.liveMatches}
            icon={Zap}
            color="bg-neon-pink/20 text-neon-pink"
            href="/matches?status=live"
          />
          <StatCard
            title="Upcoming"
            value={stats.upcomingMatches}
            icon={Calendar}
            color="bg-muted text-muted-foreground"
            href="/matches?status=scheduled"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Matches */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-chivo text-xl font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-pink pulse-live" />
                Live Matches
              </h2>
              <Link to="/matches?status=live" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <Card className="bg-surface/50 border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ) : liveMatches.length > 0 ? (
              liveMatches.map((match) => (
                <Link key={match.match_id} to={`/matches/${match.match_id}`}>
                  <Card className="bg-surface/50 border-border/50 hover:border-neon-pink/50 transition-all card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="destructive" className="bg-neon-pink/20 text-neon-pink border-neon-pink/50">
                          <span className="w-2 h-2 rounded-full bg-neon-pink mr-2 pulse-live" />
                          LIVE
                        </Badge>
                        <span className="text-sm text-muted-foreground">{match.match_type}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                            {getTeamShortName(match.team1_id)}
                          </div>
                          <div>
                            <div className="font-medium">{getTeamName(match.team1_id)}</div>
                            <div className="font-mono text-xl font-bold text-primary">
                              {match.innings1?.runs || 0}/{match.innings1?.wickets || 0}
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">vs</div>
                          <div className="text-sm font-mono">
                            {match.innings1?.overs || 0} ov
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-medium">{getTeamName(match.team2_id)}</div>
                            <div className="font-mono text-xl font-bold">
                              {match.innings2?.runs || 0}/{match.innings2?.wickets || 0}
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                            {getTeamShortName(match.team2_id)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="bg-surface/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No live matches at the moment</p>
                  <Link to="/matches?status=scheduled">
                    <Button variant="link" className="mt-2">View upcoming matches</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Matches */}
            <div className="flex items-center justify-between mt-8">
              <h2 className="font-chivo text-xl font-bold">Upcoming Matches</h2>
              <Link to="/matches?status=scheduled" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-surface/50 border-border/50">
                    <CardContent className="p-4">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <Link key={match.match_id} to={`/matches/${match.match_id}`}>
                    <Card className="bg-surface/50 border-border/50 hover:border-primary/50 transition-all card-hover mb-3">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="text-center">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{getTeamShortName(match.team1_id)}</div>
                              <div className="text-xs font-medium mt-1 truncate max-w-[50px]">{getTeamName(match.team1_id)}</div>
                            </div>
                            <div className="text-sm text-muted-foreground">vs</div>
                            <div className="text-center">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{getTeamShortName(match.team2_id)}</div>
                              <div className="text-xs font-medium mt-1 truncate max-w-[50px]">{getTeamName(match.team2_id)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {new Date(match.scheduled_time || match.match_date).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">{match.venue || 'Main'}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="bg-surface/50 border-border/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">No upcoming matches scheduled</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Standings */}
            <Card className="bg-surface/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-chivo text-lg flex items-center justify-between">
                  League Standings
                  <Link to="/leaderboard" className="text-sm text-primary font-normal hover:underline">
                    Full Table
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : standings.length > 0 ? (
                  <div className="space-y-2">
                    {standings.map((team, idx) => (
                      <div key={team.team_id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-sm w-6 ${idx < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                            {team.position}
                          </span>
                          <span className="text-sm font-medium">{team.short_name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{team.matches_played}M</span>
                          <span className="font-mono font-bold text-primary">{team.points}pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No standings data</p>
                )}
              </CardContent>
            </Card>

            {/* Top Scorers */}
            <Card className="bg-surface/50 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-chivo text-lg flex items-center justify-between">
                  Top Scorers
                  <Link to="/leaderboard" className="text-sm text-primary font-normal hover:underline">
                    View All
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : topScorers.length > 0 ? (
                  <div className="space-y-2">
                    {topScorers.map((player, idx) => (
                      <Link key={player.player_id} to={`/players/${player.player_id}`}>
                        <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`font-mono text-sm w-6 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-medium truncate max-w-[120px]">{player.name}</span>
                          </div>
                          <span className="font-mono font-bold text-primary">{player.runs}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No player stats yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Animation Overlay */}
        <EventOverlay
          event={currentEvent}
          onComplete={() => setCurrentEvent(null)}
        />
      </div>
    </DashboardLayout>
  );
}
