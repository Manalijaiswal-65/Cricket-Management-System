import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const TEAM_COLORS = {
  'Mumbai Indians': 'bg-blue-600',
  'Chennai Super Kings': 'bg-yellow-500',
  'Royal Challengers Bangalore': 'bg-red-600',
  'Delhi Capitals': 'bg-indigo-600',
  'Kolkata Knight Riders': 'bg-purple-600',
  'Punjab Kings': 'bg-rose-600',
  'Rajasthan Royals': 'bg-pink-600',
  'Sunrisers Hyderabad': 'bg-orange-600',
  'Gujarat Titans': 'bg-gray-700',
  'Lucknow Super Giants': 'bg-cyan-600',
};

const TEAM_ABBR = {
  'Mumbai Indians': 'MI',
  'Chennai Super Kings': 'CSK',
  'Royal Challengers Bangalore': 'RCB',
  'Delhi Capitals': 'DC',
  'Kolkata Knight Riders': 'KKR',
  'Punjab Kings': 'PBKS',
  'Rajasthan Royals': 'RR',
  'Sunrisers Hyderabad': 'SRH',
  'Gujarat Titans': 'GT',
  'Lucknow Super Giants': 'LSG',
};

// Mock data for when no live matches are available
const MOCK_MATCH = {
  status: 'demo',
  isMock: true,
  team1_name: 'Mumbai Indians',
  team2_name: 'Chennai Super Kings',
  innings1: { runs: 186, wickets: 4, overs: 18.3 },
  innings2: { runs: 142, wickets: 8, overs: 17.2 },
  overs: 20
};

export default function LiveMatchCard() {
  const [liveMatch, setLiveMatch] = useState(null);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveMatch = async () => {
      try {
        setLoading(true);

        // First try to get live matches directly
        const liveResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/matches/live`
        );

        if (liveResponse.data?.length > 0) {
          const match = liveResponse.data[0];
          setLiveMatch(match);

          // Fetch team details
          await fetchTeamDetails(match.team1_id, match.team2_id);
        } else {
          // No live matches, try to get the most recent tournament match
          const tournamentsResponse = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/tournaments`
          );

          const tournaments = tournamentsResponse.data || [];
          const liveTournament = tournaments.find(t => t.status === 'live');

          if (liveTournament) {
            const matchesResponse = await axios.get(
              `${process.env.REACT_APP_BACKEND_URL}/api/tournament-matches?tournamentId=${liveTournament.tournament_id}`
            );

            if (matchesResponse.data?.matches?.length > 0) {
              const liveOrFirst = matchesResponse.data.matches.find(m => m.status === 'live')
                || matchesResponse.data.matches[0];
              setLiveMatch(liveOrFirst);
              await fetchTeamDetails(liveOrFirst.team1_id, liveOrFirst.team2_id);
            } else {
              setLiveMatch(MOCK_MATCH);
            }
          } else {
            setLiveMatch(MOCK_MATCH);
          }
        }
      } catch (err) {
        console.error('Error fetching live match:', err);
        setLiveMatch(MOCK_MATCH);
      } finally {
        setLoading(false);
      }
    };

    const fetchTeamDetails = async (team1Id, team2Id) => {
      try {
        const teamsResponse = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/teams`
        );
        const teamsMap = {};
        teamsResponse.data?.forEach(t => {
          teamsMap[t.team_id] = t;
        });
        setTeams(teamsMap);
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
    };

    fetchLiveMatch();
    const interval = setInterval(fetchLiveMatch, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-surface/80 rounded-xl p-4 border border-border/50 animate-pulse">
        <div className="h-8 bg-muted rounded mb-4" />
        <div className="h-12 bg-muted rounded" />
      </div>
    );
  }

  if (!liveMatch) {
    return (
      <div className="bg-surface/80 rounded-xl p-4 border border-border/50">
        <div className="text-xs text-muted-foreground">Match Status</div>
        <div className="text-sm text-muted-foreground mt-2">
          No live matches available
        </div>
      </div>
    );
  }

  // Handle both real match data and mock data
  const isMock = liveMatch.isMock;
  const team1 = isMock ? { name: liveMatch.team1_name } : teams[liveMatch.team1_id] || { name: liveMatch.team1_id };
  const team2 = isMock ? { name: liveMatch.team2_name } : teams[liveMatch.team2_id] || { name: liveMatch.team2_id };

  const innings1 = liveMatch.innings1 || {};
  const innings2 = liveMatch.innings2 || {};

  const team1Name = team1?.name || team1?.short_name || 'Team 1';
  const team2Name = team2?.name || team2?.short_name || 'Team 2';

  const team1Abbr = TEAM_ABBR[team1Name] || team1?.short_name || team1Name.substring(0, 3).toUpperCase();
  const team2Abbr = TEAM_ABBR[team2Name] || team2?.short_name || team2Name.substring(0, 3).toUpperCase();

  const team1Color = TEAM_COLORS[team1Name] || (team1?.primary_color ? `bg-[${team1.primary_color}]` : 'bg-blue-600');
  const team2Color = TEAM_COLORS[team2Name] || (team2?.primary_color ? `bg-[${team2.primary_color}]` : 'bg-yellow-500');

  const isLive = liveMatch.status === 'live';
  const overs = innings1.overs ? parseFloat(innings1.overs).toFixed(1) : '0.0';

  const CardWrapper = ({ children }) => {
    if (isMock) {
      return <div className="bg-surface/80 rounded-xl p-4 border border-border/50">{children}</div>;
    }
    return (
      <Link
        to={`/tournament-matches/${liveMatch.match_id}`}
        className="bg-surface/80 rounded-xl p-4 border border-border/50 block hover:border-primary/50 transition-colors"
      >
        {children}
      </Link>
    );
  };

  return (
    <CardWrapper>
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 text-xs font-medium">
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-neon-pink' : isMock ? 'bg-muted-foreground' : 'bg-muted-foreground'} ${isLive ? 'pulse-live' : ''}`} />
          <span className={isLive ? 'text-neon-pink' : 'text-muted-foreground'}>
            {isLive ? 'LIVE' : isMock ? 'DEMO' : liveMatch.status?.toUpperCase() || 'SCHEDULED'}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">
          {liveMatch.overs || 20} Overs Match
        </span>
      </div>

      <div className="flex items-center justify-between">
        {/* Team 1 */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${team1Color}`}
            style={team1?.primary_color ? { backgroundColor: team1.primary_color } : {}}
          >
            {team1Abbr}
          </div>
          <div>
            <div className="font-medium text-sm truncate max-w-[100px]">{team1Name}</div>
            <div className="font-mono text-2xl font-bold text-primary">
              {innings1.runs || 0}/{innings1.wickets || 0}
            </div>
          </div>
        </div>

        {/* Center Info */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">vs</div>
          <div className="text-sm font-medium">{overs} ov</div>
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-3 flex-row-reverse">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${team2Color}`}
            style={team2?.primary_color ? { backgroundColor: team2.primary_color, color: '#000' } : { color: '#000' }}
          >
            {team2Abbr}
          </div>
          <div className="text-right">
            <div className="font-medium text-sm truncate max-w-[100px]">{team2Name}</div>
            <div className="font-mono text-2xl font-bold">
              {innings2.runs || 0}/{innings2.wickets || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Match Info */}
      {liveMatch.current_innings && (
        <div className="mt-4 pt-3 border-t border-border/30 text-center text-sm text-muted-foreground">
          {liveMatch.current_innings === 1
            ? `${team1Name} batting`
            : liveMatch.innings1?.runs
              ? `${team2Name} need ${(liveMatch.innings1.runs + 1) - (innings2.runs || 0)} runs`
              : `${team2Name} batting`
          }
        </div>
      )}
    </CardWrapper>
  );
}
