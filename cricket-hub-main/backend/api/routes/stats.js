const express = require('express');
const { Team, Player } = require('../../models');

const router = express.Router();

// Get standings
router.get('/standings', async (req, res) => {
  try {
    const teams = await Team.find().sort({ points: -1, net_run_rate: -1 }).select('-_id -__v');

    const result = teams.map((team, idx) => ({
      position: idx + 1,
      team_id: team.team_id,
      name: team.name,
      short_name: team.short_name,
      logo_url: team.logo_url,
      matches_played: team.matches_played,
      won: team.matches_won,
      lost: team.matches_lost,
      drawn: team.matches_drawn,
      points: team.points,
      nrr: team.net_run_rate
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch standings' });
  }
});

// Get batting leaderboard
router.get('/leaderboard/batting', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const players = await Player.find({ matches: { $gt: 0 } })
      .sort({ runs: -1 })
      .limit(limit)
      .select('-_id -__v');

    const result = players.map(p => ({
      player_id: p.player_id,
      name: p.name,
      team_id: p.team_id,
      matches: p.matches,
      runs: p.runs,
      average: p.matches > 0 ? (p.runs / p.matches).toFixed(2) : 0,
      strike_rate: p.balls_faced > 0 ? ((p.runs / p.balls_faced) * 100).toFixed(2) : 0,
      highest_score: p.highest_score,
      fours: p.fours,
      sixes: p.sixes,
      fifties: p.fifties,
      hundreds: p.hundreds
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch batting leaderboard' });
  }
});

// Get bowling leaderboard
router.get('/leaderboard/bowling', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const players = await Player.find({ wickets: { $gt: 0 } })
      .sort({ wickets: -1 })
      .limit(limit)
      .select('-_id -__v');

    const result = players.map(p => ({
      player_id: p.player_id,
      name: p.name,
      team_id: p.team_id,
      matches: p.matches,
      wickets: p.wickets,
      runs_conceded: p.runs_conceded,
      average: p.wickets > 0 ? (p.runs_conceded / p.wickets).toFixed(2) : 0,
      economy_rate: p.balls_bowled > 0 ? ((p.runs_conceded / (p.balls_bowled / 6)) * 1).toFixed(2) : 0,
      best_bowling: p.best_bowling,
      four_wickets: p.four_wickets,
      five_wickets: p.five_wickets
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch bowling leaderboard' });
  }
});

module.exports = router;
