import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  ArrowLeft, 
  Target,
  TrendingUp,
  Award,
  Crosshair,
  Sparkles,
  Loader2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PlayerDetailPage() {
  const { playerId } = useParams();
  const { token } = useAuth();
  const [player, setPlayer] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  useEffect(() => {
    fetchPlayerData();
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { headers, withCredentials: true };

      const playerRes = await axios.get(`${API_URL}/api/players/${playerId}`, config);
      setPlayer(playerRes.data);

      // Fetch team data
      if (playerRes.data.team_id) {
        const teamRes = await axios.get(`${API_URL}/api/teams/${playerRes.data.team_id}`, config);
        setTeam(teamRes.data);
      }
    } catch (error) {
      console.error('Error fetching player:', error);
      toast.error('Failed to load player details');
    } finally {
      setLoading(false);
    }
  };

  const calculateStrikeRate = () => {
    if (!player?.balls_faced || player.balls_faced === 0) return 0;
    return ((player.runs / player.balls_faced) * 100).toFixed(2);
  };

  const calculateBattingAvg = () => {
    if (!player?.matches || player.matches === 0) return 0;
    return (player.runs / player.matches).toFixed(2);
  };

  const calculateEconomy = () => {
    if (!player?.balls_bowled || player.balls_bowled === 0) return 0;
    const overs = player.balls_bowled / 6;
    return (player.runs_conceded / overs).toFixed(2);
  };

  const fetchAIPrediction = async () => {
    setLoadingPrediction(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/ai/predict/${playerId}`, { headers, withCredentials: true });
      setPrediction(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get AI prediction');
    } finally {
      setLoadingPrediction(false);
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

  if (!player) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="font-chivo text-2xl font-bold mb-4">Player Not Found</h2>
          <Link to="/players">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="player-detail-page">
        {/* Back Button */}
        <Link to="/players">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Players
          </Button>
        </Link>

        {/* Player Header */}
        <Card className="bg-surface/50 border-border/50 overflow-hidden">
          <div 
            className="h-2"
            style={{ backgroundColor: team?.primary_color || '#4ade80' }}
          />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
                style={{ 
                  backgroundColor: (team?.primary_color || '#4ade80') + '20',
                  color: team?.primary_color || '#4ade80'
                }}
              >
                #{player.jersey_number}
              </div>
              <div className="flex-1">
                <h1 className="font-chivo text-2xl sm:text-3xl font-bold mb-2">{player.name}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {team && (
                    <Link to={`/teams/${team.team_id}`}>
                      <Badge 
                        className="cursor-pointer"
                        style={{ 
                          backgroundColor: team.primary_color + '20',
                          color: team.primary_color,
                          borderColor: team.primary_color
                        }}
                      >
                        {team.name}
                      </Badge>
                    </Link>
                  )}
                  <Badge variant="outline" className="capitalize">{player.role}</Badge>
                  <Badge variant="secondary">{player.batting_style}</Badge>
                  {player.bowling_style && (
                    <Badge variant="secondary">{player.bowling_style}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/50">
              <div className="text-center">
                <div className="font-mono text-2xl font-bold">{player.matches}</div>
                <div className="text-sm text-muted-foreground">Matches</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-primary">{player.runs}</div>
                <div className="text-sm text-muted-foreground">Runs</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-secondary">{player.wickets}</div>
                <div className="text-sm text-muted-foreground">Wickets</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold">{player.catches}</div>
                <div className="text-sm text-muted-foreground">Catches</div>
              </div>
            </div>

            {/* AI Prediction Button */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <Button 
                onClick={fetchAIPrediction}
                disabled={loadingPrediction}
                className="w-full"
                variant="outline"
                data-testid="ai-predict-btn"
              >
                {loadingPrediction ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Prediction...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get AI Performance Prediction
                  </>
                )}
              </Button>
              
              {prediction && (
                <Card className="mt-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      AI Performance Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{prediction.prediction_text}</p>
                    {prediction.predicted_runs && (
                      <div className="mt-3 flex gap-4 text-sm">
                        <Badge variant="secondary">
                          Predicted Runs: ~{prediction.predicted_runs}
                        </Badge>
                        {prediction.predicted_wickets && (
                          <Badge variant="secondary">
                            Predicted Wickets: ~{prediction.predicted_wickets}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Tabs */}
        <Tabs defaultValue="batting" className="space-y-6">
          <TabsList className="bg-surface border border-border">
            <TabsTrigger value="batting">Batting</TabsTrigger>
            <TabsTrigger value="bowling">Bowling</TabsTrigger>
            <TabsTrigger value="fielding">Fielding</TabsTrigger>
          </TabsList>

          <TabsContent value="batting">
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="bg-surface/50 border-border/50">
                <CardHeader>
                  <CardTitle className="font-chivo text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Batting Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Runs</span>
                    <span className="font-mono font-bold text-primary">{player.runs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Balls Faced</span>
                    <span className="font-mono font-bold">{player.balls_faced}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Strike Rate</span>
                    <span className="font-mono font-bold">{calculateStrikeRate()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Average</span>
                    <span className="font-mono font-bold">{calculateBattingAvg()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Highest Score</span>
                    <span className="font-mono font-bold">{player.highest_score}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-surface/50 border-border/50">
                <CardHeader>
                  <CardTitle className="font-chivo text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fours</span>
                    <span className="font-mono font-bold">{player.fours}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sixes</span>
                    <span className="font-mono font-bold">{player.sixes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Fifties</span>
                    <span className="font-mono font-bold">{player.fifties}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Hundreds</span>
                    <span className="font-mono font-bold">{player.hundreds}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bowling">
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="bg-surface/50 border-border/50">
                <CardHeader>
                  <CardTitle className="font-chivo text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    Bowling Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Wickets</span>
                    <span className="font-mono font-bold text-secondary">{player.wickets}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Balls Bowled</span>
                    <span className="font-mono font-bold">{player.balls_bowled}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Overs</span>
                    <span className="font-mono font-bold">{(player.balls_bowled / 6).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Runs Conceded</span>
                    <span className="font-mono font-bold">{player.runs_conceded}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Economy</span>
                    <span className="font-mono font-bold">{calculateEconomy()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Best Bowling</span>
                    <span className="font-mono font-bold">{player.best_bowling}</span>
                  </div>
                </CardContent>
              </Card>

              {player.bowling_style && (
                <Card className="bg-surface/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="font-chivo text-lg">Bowling Style</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <Crosshair className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium capitalize">{player.bowling_style}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="fielding">
            <Card className="bg-surface/50 border-border/50">
              <CardHeader>
                <CardTitle className="font-chivo text-lg">Fielding Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-muted/30 rounded-xl">
                    <div className="font-mono text-4xl font-bold text-primary mb-2">{player.catches}</div>
                    <div className="text-muted-foreground">Catches</div>
                  </div>
                  <div className="text-center p-6 bg-muted/30 rounded-xl">
                    <div className="font-mono text-4xl font-bold text-secondary mb-2">{player.stumpings}</div>
                    <div className="text-muted-foreground">Stumpings</div>
                  </div>
                  <div className="text-center p-6 bg-muted/30 rounded-xl">
                    <div className="font-mono text-4xl font-bold mb-2">{player.run_outs}</div>
                    <div className="text-muted-foreground">Run Outs</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
