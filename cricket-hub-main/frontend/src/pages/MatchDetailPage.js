import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
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
  Play, 
  RefreshCw, 
  Square, 
  MapPin, 
  Calendar,
  Trophy,
  Send,
  Users,
  MessageCircle,
  Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function MatchDetailPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { token, user, isAdmin, isManager } = useAuth();
  const [match, setMatch] = useState(null);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Chat states
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const messagesEndRef = useRef(null);
  
  // AI Prediction states
  const [matchPrediction, setMatchPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  
  // Dialog states
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  
  // Form states
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState('bat');
  const [scoreUpdate, setScoreUpdate] = useState({
    innings: 1,
    runs: 0,
    wickets: 0,
    overs: 0,
    extras: 0
  });
  const [endMatchData, setEndMatchData] = useState({
    winner_id: '',
    result_summary: '',
    man_of_match: ''
  });

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

  useEffect(() => {
    fetchMatchData();
    // Poll for updates every 10 seconds if match is live
    const interval = setInterval(() => {
      if (match?.status === 'live') {
        fetchMatchData();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [matchId]);

  const fetchMatchData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      const matchRes = await axios.get(`${API_URL}/api/matches/${matchId}`, config);
      setMatch(matchRes.data);

      // Fetch teams
      const [team1Res, team2Res] = await Promise.all([
        axios.get(`${API_URL}/api/teams/${matchRes.data.team1_id}`, config),
        axios.get(`${API_URL}/api/teams/${matchRes.data.team2_id}`, config)
      ]);

      setTeams({
        [team1Res.data.team_id]: team1Res.data,
        [team2Res.data.team_id]: team2Res.data
      });

      if (matchRes.data.innings1) {
        setScoreUpdate({
          innings: matchRes.data.innings2 ? 2 : 1,
          runs: matchRes.data.innings2?.runs || matchRes.data.innings1.runs,
          wickets: matchRes.data.innings2?.wickets || matchRes.data.innings1.wickets,
          overs: matchRes.data.innings2?.overs || matchRes.data.innings1.overs,
          extras: matchRes.data.innings2?.extras || matchRes.data.innings1.extras
        });
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

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

  const fetchMatchPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/ai/match-prediction/${matchId}`, { headers, withCredentials: true });
      setMatchPrediction(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get AI prediction');
    } finally {
      setLoadingPrediction(false);
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
        `${API_URL}/api/matches/${matchId}/start?toss_winner=${tossWinner}&toss_decision=${tossDecision}`,
        {},
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

  const handleUpdateScore = async () => {
    setUpdating(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API_URL}/api/matches/${matchId}/score`, scoreUpdate, { headers, withCredentials: true });
      toast.success('Score updated!');
      setScoreDialogOpen(false);
      fetchMatchData();
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
      await axios.post(`${API_URL}/api/matches/${matchId}/switch-innings`, {}, { headers, withCredentials: true });
      toast.success('Innings switched!');
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
      await axios.post(`${API_URL}/api/matches/${matchId}/end`, endMatchData, { headers, withCredentials: true });
      toast.success('Match ended!');
      setEndDialogOpen(false);
      fetchMatchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to end match');
    } finally {
      setUpdating(false);
    }
  };

  const team1 = match ? teams[match.team1_id] : null;
  const team2 = match ? teams[match.team2_id] : null;

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
          <Link to="/matches">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Matches
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const canManageMatch = isAdmin || isManager;

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="match-detail-page">
        <Link to="/matches">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live Chat - Left Side */}
          <Card className="bg-surface/50 border-border/50 lg:order-1 order-2">
            <CardHeader className="pb-3">
              <CardTitle className="font-chivo text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Live Chat
                </span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {viewerCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] px-4">
                <div className="space-y-3 py-2">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.message_id} className="flex items-start gap-2">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={msg.user_picture} />
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {msg.user_name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-primary truncate">
                              {msg.user_name}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground break-words">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    placeholder={user ? "Type a message..." : "Login to chat"}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={!user}
                    className="flex-1"
                    data-testid="chat-input"
                  />
                  <Button 
                    size="icon" 
                    onClick={sendMessage} 
                    disabled={!user || !newMessage.trim()}
                    data-testid="send-message-btn"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Match Scoreboard - Center */}
          <Card className="bg-surface/50 border-border/50 lg:col-span-2 lg:order-2 order-1">
            {match.status === 'live' && (
              <div className="h-1 bg-neon-pink animate-pulse" />
            )}
            <CardContent className="p-6 sm:p-8">
              {/* Status & Info */}
              <div className="flex items-center justify-between mb-6">
                {match.status === 'live' ? (
                  <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50">
                    <span className="w-2 h-2 rounded-full bg-neon-pink mr-2 pulse-live" />
                    LIVE
                  </Badge>
                ) : match.status === 'completed' ? (
                  <Badge variant="outline" className="text-primary border-primary/50">
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="secondary">Scheduled</Badge>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(match.match_date).toLocaleDateString()}
                  </span>
                  <span>{match.match_type}</span>
                </div>
              </div>

              {/* Scoreboard */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                    style={{ 
                      backgroundColor: (team1?.primary_color || '#4ade80') + '20',
                      color: team1?.primary_color || '#4ade80'
                    }}
                  >
                    {team1?.short_name || 'T1'}
                  </div>
                  <h3 className="font-chivo font-bold text-lg">{team1?.name || 'Team 1'}</h3>
                  {match.innings1 && (
                    <div className="mt-2">
                      <div className="font-mono text-3xl font-bold text-primary">
                        {match.innings1.runs}/{match.innings1.wickets}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ({match.innings1.overs} overs)
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <span className="font-chivo font-bold text-xl">VS</span>
                  </div>
                  {match.toss_winner && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {teams[match.toss_winner]?.short_name} won toss, chose to {match.toss_decision}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                    style={{ 
                      backgroundColor: (team2?.primary_color || '#3b82f6') + '20',
                      color: team2?.primary_color || '#3b82f6'
                    }}
                  >
                    {team2?.short_name || 'T2'}
                  </div>
                  <h3 className="font-chivo font-bold text-lg">{team2?.name || 'Team 2'}</h3>
                  {match.innings2 && (
                    <div className="mt-2">
                      <div className="font-mono text-3xl font-bold">
                        {match.innings2.runs}/{match.innings2.wickets}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ({match.innings2.overs} overs)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Result */}
              {match.result_summary && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
                  <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-medium">{match.result_summary}</p>
                  {match.man_of_match && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Man of the Match: {match.man_of_match}
                    </p>
                  )}
                </div>
              )}

              {/* Venue */}
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {match.venue}
              </div>

              {/* AI Prediction Button */}
              {match.status !== 'completed' && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={fetchMatchPrediction}
                    disabled={loadingPrediction}
                    className="w-full"
                    data-testid="ai-prediction-btn"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {loadingPrediction ? 'Getting AI Prediction...' : 'Get AI Match Prediction'}
                  </Button>
                  
                  {matchPrediction && (
                    <Card className="mt-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          AI Match Prediction
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{matchPrediction.prediction}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Actions */}
              {canManageMatch && match.status !== 'completed' && (
                <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap gap-3">
                  {match.status === 'scheduled' && (
                    <Button onClick={() => setStartDialogOpen(true)} className="neon-glow-green">
                      <Play className="w-4 h-4 mr-2" />
                      Start Match
                    </Button>
                  )}
                  
                  {match.status === 'live' && (
                    <>
                      <Button onClick={() => setScoreDialogOpen(true)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Update Score
                      </Button>
                      
                      {match.innings1 && !match.innings2 && (
                        <Button variant="outline" onClick={handleSwitchInnings} disabled={updating}>
                          Switch Innings
                        </Button>
                      )}
                      
                      <Button variant="destructive" onClick={() => setEndDialogOpen(true)}>
                        <Square className="w-4 h-4 mr-2" />
                        End Match
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Start Match Dialog */}
        <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-chivo">Start Match</DialogTitle>
              <DialogDescription>Enter toss details to start the match</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Toss Winner</Label>
                <Select value={tossWinner} onValueChange={setTossWinner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={match.team1_id}>{team1?.name}</SelectItem>
                    <SelectItem value={match.team2_id}>{team2?.name}</SelectItem>
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
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStartDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleStartMatch} disabled={updating}>
                {updating ? 'Starting...' : 'Start Match'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Update Score Dialog */}
        <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-chivo">Update Score</DialogTitle>
              <DialogDescription>Update the current innings score</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Runs</Label>
                  <Input
                    type="number"
                    min="0"
                    value={scoreUpdate.runs}
                    onChange={(e) => setScoreUpdate({ ...scoreUpdate, runs: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wickets</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={scoreUpdate.wickets}
                    onChange={(e) => setScoreUpdate({ ...scoreUpdate, wickets: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Overs</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={scoreUpdate.overs}
                    onChange={(e) => setScoreUpdate({ ...scoreUpdate, overs: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extras</Label>
                  <Input
                    type="number"
                    min="0"
                    value={scoreUpdate.extras}
                    onChange={(e) => setScoreUpdate({ ...scoreUpdate, extras: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateScore} disabled={updating}>
                {updating ? 'Updating...' : 'Update Score'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* End Match Dialog */}
        <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
          <DialogContent className="bg-surface border-border">
            <DialogHeader>
              <DialogTitle className="font-chivo">End Match</DialogTitle>
              <DialogDescription>Enter match result details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Winner</Label>
                <Select 
                  value={endMatchData.winner_id} 
                  onValueChange={(v) => setEndMatchData({ ...endMatchData, winner_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select winner (optional for draw)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Result / Draw</SelectItem>
                    <SelectItem value={match.team1_id}>{team1?.name}</SelectItem>
                    <SelectItem value={match.team2_id}>{team2?.name}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Result Summary</Label>
                <Input
                  placeholder="e.g., Mumbai Indians won by 5 wickets"
                  value={endMatchData.result_summary}
                  onChange={(e) => setEndMatchData({ ...endMatchData, result_summary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Man of the Match (optional)</Label>
                <Input
                  placeholder="Player name"
                  value={endMatchData.man_of_match}
                  onChange={(e) => setEndMatchData({ ...endMatchData, man_of_match: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEndDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEndMatch} disabled={updating} variant="destructive">
                {updating ? 'Ending...' : 'End Match'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
