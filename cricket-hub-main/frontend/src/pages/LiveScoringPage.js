import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import EventOverlay from '../components/EventOverlay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
  Play,
  Pause,
  RefreshCw,
  Square,
  MapPin,
  Calendar,
  Trophy,
  Send,
  Users,
  MessageCircle,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Target,
  CircleDot,
  Zap,
  Award
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function to format overs properly (e.g., 18.3 -> 18.3, not 0.2)
const formatOvers = (overs) => {
  if (!overs && overs !== 0) return '0.0';
  if (typeof overs === 'string') overs = parseFloat(overs);
  if (isNaN(overs)) return '0.0';

  const wholeOvers = Math.floor(overs);
  const balls = Math.round((overs - wholeOvers) * 10);
  return `${wholeOvers}.${balls}`;
};

// Helper to convert overs (e.g., 2.3) to total balls (e.g., 15)
const oversToBalls = (overs) => {
  if (!overs && overs !== 0) return 0;
  const wholeOvers = Math.floor(overs);
  const ballsInOver = Math.round((overs - wholeOvers) * 10);
  return wholeOvers * 6 + ballsInOver;
};

// Helper to convert total balls to overs format (e.g., 15 -> 2.3)
const ballsToOvers = (balls) => {
  const wholeOvers = Math.floor(balls / 6);
  const remainingBalls = balls % 6;
  return wholeOvers + remainingBalls / 10;
};

// Add animation styles for score buttons - different animations for different actions
const addAnimationStyle = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Standard run animation - green pulse */
    @keyframes runPulse {
      0% { transform: scale(1); background-color: inherit; }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); background-color: inherit; }
    }
    .animate-run {
      animation: runPulse 0.3s ease-out;
    }

    /* Four animation - blue wave with glow */
    @keyframes fourWave {
      0% { transform: scale(1) rotate(0deg); box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
      25% { transform: scale(1.2) rotate(-3deg); box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
      50% { transform: scale(1.25) rotate(3deg); box-shadow: 0 0 30px rgba(59, 130, 246, 1); }
      75% { transform: scale(1.15) rotate(-2deg); box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); }
      100% { transform: scale(1) rotate(0deg); box-shadow: 0 0 0 rgba(59, 130, 246, 0); }
    }
    .animate-four {
      animation: fourWave 0.5s ease-out;
    }

    /* Six animation - purple explosion with bigger glow */
    @keyframes sixExplosion {
      0% { transform: scale(1); box-shadow: 0 0 0 rgba(147, 51, 234, 0); filter: brightness(1); }
      30% { transform: scale(1.3); box-shadow: 0 0 40px rgba(147, 51, 234, 1); filter: brightness(1.3); }
      50% { transform: scale(1.4); box-shadow: 0 0 60px rgba(147, 51, 234, 1), 0 0 100px rgba(236, 72, 153, 0.5); filter: brightness(1.5); }
      100% { transform: scale(1); box-shadow: 0 0 0 rgba(147, 51, 234, 0); filter: brightness(1); }
    }
    .animate-six {
      animation: sixExplosion 0.6s ease-out;
    }

    /* Wicket animation - red shake */
    @keyframes wicketShake {
      0%, 100% { transform: translateX(0) scale(1); box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) scale(1.05); }
      20%, 40%, 60%, 80% { transform: translateX(4px) scale(1.05); }
      50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
    }
    .animate-wicket {
      animation: wicketShake 0.5s ease-out;
    }

    /* Extras animation - yellow bounce */
    @keyframes extrasBounce {
      0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 0 0 rgba(234, 179, 8, 0); }
      25% { transform: translateY(-8px) scale(1.1); box-shadow: 0 0 15px rgba(234, 179, 8, 0.6); }
      50% { transform: translateY(0) scale(1.05); }
      75% { transform: translateY(-4px) scale(1.08); box-shadow: 0 0 10px rgba(234, 179, 8, 0.4); }
    }
    .animate-extras {
      animation: extrasBounce 0.4s ease-out;
    }

    /* Dot ball animation - subtle fade */
    @keyframes dotFade {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    .animate-dot {
      animation: dotFade 0.2s ease-out;
    }
  `;
  document.head.appendChild(style);
};

export default function LiveScoringPage() {
  const { matchId } = useParams();

  // Initialize animation styles on mount
  useEffect(() => {
    addAnimationStyle();
  }, []);
  const navigate = useNavigate();
  const { token, user, isAdmin, isManager } = useAuth();
  const [match, setMatch] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState({});
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Socket
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const messagesEndRef = useRef(null);
  const [animatingButton, setAnimatingButton] = useState(null);
  const [currentEvent, setCurrentEvent] = useState(null);
  const prevMatchRef = useRef(null);

  // Dialog states
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);

  // Form states
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');
  const [currentInnings, setCurrentInnings] = useState(1);
  const [endMatchData, setEndMatchData] = useState({
    winner_id: '',
    result_summary: '',
    man_of_match: ''
  });

  // Helper to get animation class based on button type
  const getAnimationClass = (buttonId) => {
    if (!buttonId || animatingButton !== buttonId) return '';
    if (buttonId === 'button-4') return 'animate-four';
    if (buttonId === 'button-6') return 'animate-six';
    if (buttonId === 'button-wicket') return 'animate-wicket';
    if (buttonId === 'button-0') return 'animate-dot';
    if (buttonId.includes('wide') || buttonId.includes('noball') || buttonId.includes('bye')) return 'animate-extras';
    return 'animate-run';
  };

  // Helper to add animation to button with variable duration
  const animateButton = (buttonId) => {
    setAnimatingButton(buttonId);
    // Different durations for different animations
    let duration = 300;
    if (buttonId === 'button-4') duration = 500;
    if (buttonId === 'button-6') duration = 600;
    if (buttonId === 'button-wicket') duration = 500;
    setTimeout(() => setAnimatingButton(null), duration);
  };

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave_match', { match_id: matchId });
        newSocket.disconnect();
      }
    };
  }, [matchId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      socket.emit('join_match', { match_id: matchId, user });
    });

    socket.on('recent_messages', (msgs) => {
      setMessages(msgs);
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('viewer_count', (count) => {
      setViewerCount(count);
    });

    socket.on('score_update', (matchData) => {
      // Detect what event occurred by comparing with previous match state
      const prevMatch = prevMatchRef.current;
      if (prevMatch && matchData) {
        const prevInnings = prevMatch.innings2?.status === 'in_progress' ? prevMatch.innings2 : prevMatch.innings1;
        const currentInningsData = matchData.innings2?.status === 'in_progress' ? matchData.innings2 : matchData.innings1;

        if (prevInnings && currentInningsData) {
          const runsDiff = (currentInningsData.runs || 0) - (prevInnings.runs || 0);
          const wicketsDiff = (currentInningsData.wickets || 0) - (prevInnings.wickets || 0);
          const extrasDiff = (currentInningsData.extras || 0) - (prevInnings.extras || 0);

          // Check for match ending (winner)
          if (matchData.status === 'completed' && prevMatch.status !== 'completed') {
            const winnerTeamId = matchData.winner_id;
            setCurrentEvent({
              type: 'winning',
              winner: teams[winnerTeamId]?.name || 'Winner'
            });
          }
          // Check for innings switch
          else if (prevMatch.innings1?.status === 'in_progress' && matchData.innings1?.status === 'completed' && matchData.innings2?.status === 'in_progress') {
            setCurrentEvent({ type: 'end_innings' });
          }
          // Check for wicket
          else if (wicketsDiff > 0) {
            setCurrentEvent({ type: 'wicket' });
          }
          // Check for six
          else if (runsDiff === 6 && extrasDiff === 0) {
            setCurrentEvent({ type: 'six' });
          }
          // Check for four
          else if (runsDiff === 4 && extrasDiff === 0) {
            setCurrentEvent({ type: 'four' });
          }
          // Check for extras (wide, no-ball)
          else if (extrasDiff > 0 && runsDiff === 1) {
            // Could be wide or no-ball - both add 1 run as extra
            setCurrentEvent({ type: 'wide' }); // Default to wide, could be enhanced
          }
          // Check for dot ball
          else if (runsDiff === 0 && extrasDiff === 0 && wicketsDiff === 0) {
            // Only show dot if overs changed (actual delivery)
            const prevOvers = prevInnings.overs || 0;
            const currentOvers = currentInningsData.overs || 0;
            if (currentOvers > prevOvers) {
              setCurrentEvent({ type: 'dot' });
            }
          }
          // Regular runs (1, 2, 3, 5)
          else if (runsDiff > 0 && runsDiff !== 4 && runsDiff !== 6) {
            setCurrentEvent({ type: 'runs', runs: runsDiff });
          }
        }
      }

      prevMatchRef.current = matchData;
      setMatch(matchData);
    });

    return () => {
      socket.off('connect');
      socket.off('recent_messages');
      socket.off('new_message');
      socket.off('viewer_count');
      socket.off('score_update');
    };
  }, [socket, matchId, user]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMatchData = useCallback(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      const matchRes = await axios.get(`${API_URL}/api/tournament-matches/${matchId}`, config);
      setMatch(matchRes.data);

      // Fetch tournament
      if (matchRes.data.tournament_id) {
        const tournamentRes = await axios.get(`${API_URL}/api/tournaments/${matchRes.data.tournament_id}`, config);
        setTournament(tournamentRes.data);
      }

      // Fetch teams and players
      if (matchRes.data.team1_id && matchRes.data.team2_id) {
        const [team1Res, team2Res, players1Res, players2Res] = await Promise.all([
          axios.get(`${API_URL}/api/teams/${matchRes.data.team1_id}`, config).catch(() => ({ data: null })),
          axios.get(`${API_URL}/api/teams/${matchRes.data.team2_id}`, config).catch(() => ({ data: null })),
          axios.get(`${API_URL}/api/players?team_id=${matchRes.data.team1_id}`, config).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/api/players?team_id=${matchRes.data.team2_id}`, config).catch(() => ({ data: [] }))
        ]);

        const teamsMap = {};
        const playersMap = {};

        if (team1Res.data) {
          teamsMap[team1Res.data.team_id] = team1Res.data;
          playersMap[team1Res.data.team_id] = players1Res.data;
        }
        if (team2Res.data) {
          teamsMap[team2Res.data.team_id] = team2Res.data;
          playersMap[team2Res.data.team_id] = players2Res.data;
        }

        setTeams(teamsMap);
        setPlayers(playersMap);
      }

      // Set current innings
      if (matchRes.data.innings2?.status === 'in_progress') {
        setCurrentInnings(2);
      } else {
        setCurrentInnings(1);
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match details');
    } finally {
      setLoading(false);
    }
  }, [matchId, token]);

  useEffect(() => {
    fetchMatchData();
  }, [fetchMatchData]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      match_id: matchId,
      message: newMessage.trim(),
      user
    });

    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStartMatch = async () => {
    if (!tossWinner) {
      toast.error('Please select toss winner');
      return;
    }
    setUpdating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/tournament-matches/${matchId}/start`,
        { toss_winner: tossWinner, toss_decision: tossDecision },
        { headers, withCredentials: true }
      );
      toast.success('Match started!');
      setStartDialogOpen(false);
      fetchMatchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start match');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickScore = async (runs, isWicket = false, extras = 0, buttonId = null) => {
    if (!match) return;

    // Trigger animation based on action type
    if (buttonId) animateButton(buttonId);

    // Trigger full-screen event animation for scorer too
    if (isWicket) {
      setCurrentEvent({ type: 'wicket' });
    } else if (runs === 6 && extras === 0) {
      setCurrentEvent({ type: 'six' });
    } else if (runs === 4 && extras === 0) {
      setCurrentEvent({ type: 'four' });
    } else if (extras > 0 && buttonId?.includes('noball')) {
      setCurrentEvent({ type: 'noball' });
    } else if (extras > 0 && buttonId?.includes('wide')) {
      setCurrentEvent({ type: 'wide' });
    } else if (runs === 0 && extras === 0 && !isWicket) {
      setCurrentEvent({ type: 'dot' });
    } else if (runs > 0) {
      setCurrentEvent({ type: 'runs', runs });
    }

    const inningsData = currentInnings === 2 ? match.innings2 : match.innings1;
    if (!inningsData) return;

    const newRuns = inningsData.runs + runs + extras;
    const newWickets = inningsData.wickets + (isWicket ? 1 : 0);
    // Only add a ball for legal deliveries (not for Wide/No Ball which have extras)
    const ballsToAdd = extras > 0 ? 0 : 1;
    // Use proper conversion: overs like 2.3 means 2 overs + 3 balls = 15 balls
    const currentBalls = oversToBalls(inningsData.overs);
    const newBalls = currentBalls + ballsToAdd;
    const newOvers = ballsToOvers(newBalls);
    const newExtras = inningsData.extras + extras;

    setUpdating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(
        `${API_URL}/api/tournament-matches/${matchId}/score`,
        {
          innings: currentInnings,
          runs: newRuns,
          wickets: newWickets,
          overs: parseFloat(newOvers.toFixed(1)),
          extras: newExtras
        },
        { headers, withCredentials: true }
      );
      // No toast - animations provide feedback
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update score');
    } finally {
      setUpdating(false);
    }
  };

  const handleSwitchInnings = async () => {
    setUpdating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/tournament-matches/${matchId}/switch-innings`,
        {},
        { headers, withCredentials: true }
      );
      // Trigger end innings animation
      setCurrentEvent({ type: 'end_innings' });
      toast.success('Innings switched!');
      setCurrentInnings(2);
      fetchMatchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to switch innings');
    } finally {
      setUpdating(false);
    }
  };

  const handleEndMatch = async () => {
    if (!endMatchData.result_summary) {
      toast.error('Please enter result summary');
      return;
    }
    setUpdating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${API_URL}/api/tournament-matches/${matchId}/end`,
        endMatchData,
        { headers, withCredentials: true }
      );
      // Trigger winning animation with winner name
      const winnerName = endMatchData.winner_id === 'tie'
        ? 'It\'s a Tie!'
        : teams[endMatchData.winner_id]?.name || 'Winner';
      setCurrentEvent({ type: 'winning', winner: winnerName });
      toast.success('Match ended!');
      setEndDialogOpen(false);
      // Delay navigation to show the animation
      setTimeout(() => {
        navigate(`/tournaments/${match.tournament_id}`);
      }, 4500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to end match');
    } finally {
      setUpdating(false);
    }
  };

  const team1 = match ? teams[match.team1_id] : null;
  const team2 = match ? teams[match.team2_id] : null;
  const currentBattingTeam = currentInnings === 2
    ? teams[match?.innings2?.batting_team_id]
    : teams[match?.innings1?.batting_team_id];
  const currentBowlingTeam = currentInnings === 2
    ? (match?.innings2?.batting_team_id === match?.team1_id ? team2 : team1)
    : (match?.innings1?.batting_team_id === match?.team1_id ? team2 : team1);

  const canManage = (isManager || isAdmin);

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

  if (!match) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-chivo text-2xl font-bold mb-4">Match Not Found</h2>
          <Link to="/manager">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const innings1 = match.innings1 || { runs: 0, wickets: 0, overs: 0, extras: 0 };
  const innings2 = match.innings2 || { runs: 0, wickets: 0, overs: 0, extras: 0 };
  const currentInningsData = currentInnings === 2 ? innings2 : innings1;

  // Calculate target and required
  const target = innings1.runs + 1;
  const runsNeeded = target - innings2.runs;
  const ballsRemaining = match.overs * 6 - Math.round(innings2.overs * 6);
  const requiredRate = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)).toFixed(2) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={`/tournaments/${match.tournament_id}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-chivo text-xl sm:text-2xl font-bold">Live Scoring</h1>
                {match.status === 'live' && (
                  <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50">
                    <span className="w-2 h-2 rounded-full bg-neon-pink mr-2 pulse-live" />
                    LIVE
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{tournament?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {viewerCount} watching
            </Badge>
          </div>
        </div>

        {/* Match Not Started */}
        {match.status === 'scheduled' && canManage && (
          <Card className="bg-surface/50 border-border/50">
            <CardContent className="p-8 text-center">
              <Play className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="font-chivo text-2xl font-bold mb-2">Ready to Start?</h2>
              <p className="text-muted-foreground mb-6">
                {team1?.name} vs {team2?.name}
              </p>
              <Button
                onClick={() => setStartDialogOpen(true)}
                className="neon-glow-green"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Match
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Live Match Interface */}
        {match.status === 'live' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Scoreboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* Score Display */}
              <Card className="bg-gradient-to-br from-surface to-background border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  {/* Teams Row */}
                  <div className="grid grid-cols-2 divide-x divide-border/50">
                    {/* Team 1 */}
                    <div className={`p-6 ${match.innings1?.batting_team_id === match.team1_id && currentInnings === 1 ? 'bg-primary/10' : ''}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                          style={{
                            backgroundColor: (team1?.primary_color || '#4ade80') + '20',
                            color: team1?.primary_color || '#4ade80'
                          }}
                        >
                          {team1?.short_name || 'T1'}
                        </div>
                        <div>
                          <p className="font-bold">{team1?.name || 'Team 1'}</p>
                          {match.innings1?.batting_team_id === match.team1_id && (
                            <Badge variant="outline" className="text-xs">Batting</Badge>
                          )}
                        </div>
                      </div>
                      {match.innings1?.batting_team_id === match.team1_id ? (
                        <div>
                          <p className="text-4xl font-bold font-chivo">
                            {innings1.runs}/{innings1.wickets}
                          </p>
                          <p className="text-muted-foreground">
                            ({formatOvers(innings1.overs)} ov)
                          </p>
                        </div>
                      ) : match.innings2?.batting_team_id === match.team1_id ? (
                        <div>
                          <p className="text-4xl font-bold font-chivo">
                            {innings2.runs}/{innings2.wickets}
                          </p>
                          <p className="text-muted-foreground">
                            ({formatOvers(innings2.overs)} ov)
                          </p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-muted-foreground">Yet to bat</p>
                      )}
                    </div>

                    {/* Team 2 */}
                    <div className={`p-6 ${match.innings1?.batting_team_id === match.team2_id && currentInnings === 1 ? 'bg-primary/10' : ''}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                          style={{
                            backgroundColor: (team2?.primary_color || '#3b82f6') + '20',
                            color: team2?.primary_color || '#3b82f6'
                          }}
                        >
                          {team2?.short_name || 'T2'}
                        </div>
                        <div>
                          <p className="font-bold">{team2?.name || 'Team 2'}</p>
                          {match.innings1?.batting_team_id === match.team2_id && (
                            <Badge variant="outline" className="text-xs">Batting</Badge>
                          )}
                        </div>
                      </div>
                      {match.innings1?.batting_team_id === match.team2_id ? (
                        <div>
                          <p className="text-4xl font-bold font-chivo">
                            {innings1.runs}/{innings1.wickets}
                          </p>
                          <p className="text-muted-foreground">
                            ({formatOvers(innings1.overs)} ov)
                          </p>
                        </div>
                      ) : match.innings2?.batting_team_id === match.team2_id ? (
                        <div>
                          <p className="text-4xl font-bold font-chivo">
                            {innings2.runs}/{innings2.wickets}
                          </p>
                          <p className="text-muted-foreground">
                            ({formatOvers(innings2.overs)} ov)
                          </p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-muted-foreground">Yet to bat</p>
                      )}
                    </div>
                  </div>

                  {/* Match Status */}
                  <div className="p-4 bg-muted/20 border-t border-border/50 text-center">
                    {currentInnings === 2 && innings1.status === 'completed' ? (
                      <p className="font-medium">
                        {runsNeeded > 0
                          ? `${currentBattingTeam?.name || 'Team'} need ${runsNeeded} runs from ${ballsRemaining} balls (RR: ${requiredRate})`
                          : `${currentBattingTeam?.name || 'Team'} have won!`
                        }
                      </p>
                    ) : (
                      <p className="font-medium">
                        {currentBattingTeam?.name || 'Team'} are batting • {match.overs} overs match
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Scoring Controls */}
              {canManage && (
                <Card className="bg-surface/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Score Controls - Innings {currentInnings}
                    </CardTitle>
                    <CardDescription>
                      Quick score buttons for {currentBattingTeam?.name || 'batting team'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Run Buttons */}
                    <div>
                      <Label className="text-sm text-muted-foreground mb-3 block">Runs</Label>
                      <div className="grid grid-cols-7 gap-2">
                        {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
                          <Button
                            key={runs}
                            variant={runs === 4 || runs === 6 ? "default" : "outline"}
                            className={`h-14 text-xl font-bold ${runs === 4 ? 'bg-blue-600 hover:bg-blue-700' : runs === 6 ? 'bg-purple-600 hover:bg-purple-700' : ''} ${getAnimationClass(`button-${runs}`)}`}
                            onClick={() => handleQuickScore(runs, false, 0, `button-${runs}`)}
                            disabled={updating}
                          >
                            {runs}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Wicket & Extras */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-3 block">Wicket</Label>
                        <Button
                          variant="destructive"
                          className={`w-full h-14 text-lg font-bold ${getAnimationClass('button-wicket')}`}
                          onClick={() => handleQuickScore(0, true, 0, 'button-wicket')}
                          disabled={updating}
                        >
                          <CircleDot className="w-5 h-5 mr-2" />
                          WICKET
                        </Button>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-3 block">Extras</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant="secondary"
                            className={`h-14 ${getAnimationClass('button-wide')}`}
                            onClick={() => handleQuickScore(0, false, 1, 'button-wide')}
                            disabled={updating}
                          >
                            Wide
                          </Button>
                          <Button
                            variant="secondary"
                            className={`h-14 ${getAnimationClass('button-noball')}`}
                            onClick={() => handleQuickScore(0, false, 1, 'button-noball')}
                            disabled={updating}
                          >
                            No Ball
                          </Button>
                          <Button
                            variant="secondary"
                            className={`h-14 ${getAnimationClass('button-bye')}`}
                            onClick={() => handleQuickScore(0, false, 1, 'button-bye')}
                            disabled={updating}
                          >
                            Bye
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Match Actions */}
                    <div className="flex gap-3 pt-4 border-t border-border/50">
                      {currentInnings === 1 && innings1.status === 'in_progress' && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleSwitchInnings}
                          disabled={updating}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          End Innings
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          // Pre-fill winner based on current scores
                          if (innings2.runs > innings1.runs) {
                            setEndMatchData({
                              winner_id: innings2.batting_team_id,
                              result_summary: `${teams[innings2.batting_team_id]?.name} won by ${10 - innings2.wickets} wickets`,
                              man_of_match: ''
                            });
                          } else {
                            setEndMatchData({
                              winner_id: innings1.batting_team_id,
                              result_summary: `${teams[innings1.batting_team_id]?.name} won by ${innings1.runs - innings2.runs} runs`,
                              man_of_match: ''
                            });
                          }
                          setEndDialogOpen(true);
                        }}
                        disabled={updating}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        End Match
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Chat Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-surface/50 border-border/50 h-[600px] flex flex-col">
                <CardHeader className="border-b border-border/50 py-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="w-5 h-5" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg, idx) => (
                      <div key={msg.message_id || idx} className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={msg.user_picture} />
                          <AvatarFallback>{msg.user_name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-medium text-sm">{msg.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground break-words">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Match Completed */}
        {match.status === 'completed' && (
          <Card className="bg-surface/50 border-border/50">
            <CardContent className="p-8 text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="font-chivo text-2xl font-bold mb-2">Match Completed</h2>
              <p className="text-lg text-muted-foreground mb-4">{match.result_summary}</p>
              {match.man_of_match && (
                <Badge className="mb-4">
                  <Award className="w-4 h-4 mr-2" />
                  Man of the Match: {match.man_of_match}
                </Badge>
              )}
              <div className="mt-6">
                <Link to={`/tournaments/${match.tournament_id}`}>
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tournament
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Match Dialog */}
        <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-chivo">Start Match</DialogTitle>
              <DialogDescription>
                Enter toss details to start the match
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Toss Winner</Label>
                <Select value={tossWinner} onValueChange={setTossWinner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select toss winner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={match.team1_id}>{team1?.name || 'Team 1'}</SelectItem>
                    <SelectItem value={match.team2_id}>{team2?.name || 'Team 2'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Decision</Label>
                <Select value={tossDecision} onValueChange={setTossDecision}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bat">Bat First</SelectItem>
                    <SelectItem value="bowl">Bowl First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setStartDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStartMatch} disabled={updating}>
                  {updating ? 'Starting...' : 'Start Match'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* End Match Dialog */}
        <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-chivo">End Match</DialogTitle>
              <DialogDescription>
                Confirm match result and select man of the match
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Winner</Label>
                <Select
                  value={endMatchData.winner_id}
                  onValueChange={(v) => setEndMatchData({ ...endMatchData, winner_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={match.team1_id}>{team1?.name || 'Team 1'}</SelectItem>
                    <SelectItem value={match.team2_id}>{team2?.name || 'Team 2'}</SelectItem>
                    <SelectItem value="tie">No Result / Tie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Result Summary *</Label>
                <Input
                  placeholder="e.g., Team A won by 25 runs"
                  value={endMatchData.result_summary}
                  onChange={(e) => setEndMatchData({ ...endMatchData, result_summary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Man of the Match</Label>
                <Input
                  placeholder="Player name"
                  value={endMatchData.man_of_match}
                  onChange={(e) => setEndMatchData({ ...endMatchData, man_of_match: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEndDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEndMatch} disabled={updating} variant="destructive">
                  {updating ? 'Ending...' : 'End Match'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Event Animation Overlay for spectators */}
        <EventOverlay
          event={currentEvent}
          onComplete={() => setCurrentEvent(null)}
        />
      </div>
    </DashboardLayout>
  );
}
