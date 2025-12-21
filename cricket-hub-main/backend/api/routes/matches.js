const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { TournamentMatch, Tournament, Team } = require('../../models');
const { authenticate, requireManagerOrAdmin } = require('../../middleware');

const router = express.Router();

let broadcastScoreUpdate = null;
let broadcastTournamentUpdate = null;

router.setBroadcastFunctions = (scoreFunc, tournFunc) => {
  broadcastScoreUpdate = scoreFunc;
  broadcastTournamentUpdate = tournFunc;
};

// Get live matches
router.get('/live', async (req, res) => {
  try {
    const matches = await TournamentMatch.find({ status: 'live' })
      .sort({ scheduled_time: -1 })
      .select('-_id -__v');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch live matches' });
  }
});

// Get upcoming matches
router.get('/upcoming', async (req, res) => {
  try {
    const matches = await TournamentMatch.find({
      status: { $in: ['scheduled', 'pending'] }
    })
      .sort({ scheduled_time: 1 })
      .limit(10)
      .select('-_id -__v');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch upcoming matches' });
  }
});

// Get all tournament matches
router.get('/', async (req, res) => {
  try {
    const { tournamentId } = req.query;
    const query = tournamentId ? { tournament_id: tournamentId } : {};

    const matches = await TournamentMatch.find(query)
      .sort({ scheduled_time: -1 })
      .select('-_id -__v');
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch tournament matches' });
  }
});

// Get match details by ID
router.get('/:matchId', async (req, res) => {
  try {
    const match = await TournamentMatch.findOne({ match_id: req.params.matchId }).select('-_id -__v');
    if (!match) {
      return res.status(404).json({ detail: 'Match not found' });
    }
    res.json(match);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch match' });
  }
});

// Start match
router.post('/:matchId/start', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const { toss_winner, toss_decision } = req.body;
    const match = await TournamentMatch.findOne({ match_id: req.params.matchId });

    if (!match) {
      return res.status(404).json({ detail: 'Match not found' });
    }
    if (!['scheduled', 'pending'].includes(match.status)) {
      return res.status(400).json({ detail: 'Cannot start this match' });
    }

    const batting_first = toss_decision === 'bat' ? toss_winner :
      (toss_winner === match.team1_id ? match.team2_id : match.team1_id);

    match.status = 'live';
    match.toss_winner = toss_winner;
    match.toss_decision = toss_decision;
    match.innings1 = {
      batting_team_id: batting_first,
      runs: 0,
      wickets: 0,
      overs: 0,
      extras: 0,
      status: 'in_progress'
    };

    await match.save();

    await Tournament.updateOne(
      { tournament_id: match.tournament_id },
      { $set: { status: 'live' } }
    );

    if (broadcastScoreUpdate) {
      broadcastScoreUpdate(match.match_id, match.tournament_id, match.toObject());
    }

    res.json({ message: 'Match started', batting_first });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to start match' });
  }
});

// Update score
router.put('/:matchId/score', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const { innings, runs, wickets, overs, extras = 0 } = req.body;
    const match = await TournamentMatch.findOne({ match_id: req.params.matchId });

    if (!match) {
      return res.status(404).json({ detail: 'Match not found' });
    }
    if (match.status !== 'live') {
      return res.status(400).json({ detail: 'Match is not live' });
    }

    const inningsKey = innings === 1 ? 'innings1' : 'innings2';
    match[inningsKey] = {
      ...match[inningsKey],
      runs,
      wickets,
      overs,
      extras
    };

    await match.save();

    if (broadcastScoreUpdate) {
      broadcastScoreUpdate(match.match_id, match.tournament_id, match.toObject());
    }

    res.json(match.toObject({ versionKey: false }));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update score' });
  }
});

// Switch innings
router.post('/:matchId/switch-innings', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const match = await TournamentMatch.findOne({ match_id: req.params.matchId });

    if (!match || !match.innings1) {
      return res.status(400).json({ detail: 'Invalid match state' });
    }

    const batting_team = match.innings1.batting_team_id;
    const next_batting = batting_team === match.team1_id ? match.team2_id : match.team1_id;

    match.innings1.status = 'completed';
    match.innings2 = {
      batting_team_id: next_batting,
      runs: 0,
      wickets: 0,
      overs: 0,
      extras: 0,
      status: 'in_progress'
    };

    await match.save();

    if (broadcastScoreUpdate) {
      broadcastScoreUpdate(match.match_id, match.tournament_id, match.toObject());
    }

    res.json({ message: 'Innings switched', batting_team: next_batting });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to switch innings' });
  }
});

// End match
router.post('/:matchId/end', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const { winner_id, result_summary, man_of_match } = req.body;
    const match = await TournamentMatch.findOne({ match_id: req.params.matchId });

    if (!match) {
      return res.status(404).json({ detail: 'Match not found' });
    }

    match.status = 'completed';
    match.winner_id = winner_id || null;
    match.result_summary = result_summary;
    match.man_of_match = man_of_match || null;
    if (match.innings1) match.innings1.status = 'completed';
    if (match.innings2) match.innings2.status = 'completed';

    await match.save();

    if (winner_id) {
      await Team.updateOne(
        { team_id: winner_id },
        {
          $inc: { matches_won: 1, matches_played: 1, points: 2 }
        }
      );
    }

    const tournament = await Tournament.findOne({ tournament_id: match.tournament_id });
    if (tournament && winner_id) {
      const nextRoundMatches = await TournamentMatch.find({
        tournament_id: match.tournament_id,
        round: match.round + 1,
        status: 'pending'
      });

      if (nextRoundMatches.length > 0) {
        const targetMatch = nextRoundMatches[0];
        if (!targetMatch.team1_id) {
          targetMatch.team1_id = winner_id;
          targetMatch.status = targetMatch.team2_id ? 'scheduled' : 'pending';
        } else if (!targetMatch.team2_id) {
          targetMatch.team2_id = winner_id;
          targetMatch.status = 'scheduled';
        }
        await targetMatch.save();
      }
    }

    if (broadcastScoreUpdate) {
      broadcastScoreUpdate(match.match_id, match.tournament_id, match.toObject());
    }
    if (broadcastTournamentUpdate) {
      broadcastTournamentUpdate(match.tournament_id, { type: 'match_completed', match });
    }

    res.json({ message: 'Match ended successfully' });
  } catch (error) {
    console.error('End match error:', error);
    res.status(500).json({ detail: 'Failed to end match' });
  }
});

module.exports = router;
