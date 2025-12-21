const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Tournament, TournamentMatch, Team } = require('../../models');
const { authenticate, requireManagerOrAdmin } = require('../../middleware');

const router = express.Router();

// Broadcast function (to be imported from socket handlers)
let broadcastTournamentUpdate = null;
let broadcastScoreUpdate = null;

router.setBroadcastFunctions = (scoreFunc, tournFunc) => {
  broadcastScoreUpdate = scoreFunc;
  broadcastTournamentUpdate = tournFunc;
};

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { status, sport_type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (sport_type) query.sport_type = sport_type;

    const tournaments = await Tournament.find(query).sort({ created_at: -1 }).select('-_id -__v');
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch tournaments' });
  }
});

// Get tournament by ID
router.get('/:tournamentId', async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ tournament_id: req.params.tournamentId }).select('-_id -__v');
    if (!tournament) {
      return res.status(404).json({ detail: 'Tournament not found' });
    }

    const matches = await TournamentMatch.find({ tournament_id: req.params.tournamentId })
      .sort({ round: 1, match_number: 1 })
      .select('-_id -__v');

    const teamIds = tournament.teams || [];
    const teams = await Team.find({ team_id: { $in: teamIds } }).select('-_id -__v');

    res.json({
      ...tournament.toObject(),
      matches,
      team_details: teams
    });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch tournament' });
  }
});

// Create tournament
router.post('/', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const { name, sport_type, format, teams, venue, overs, start_date, match_interval_hours } = req.body;

    const tournament_id = `tourn_${uuidv4().slice(0, 8)}`;

    const tournament = new Tournament({
      tournament_id,
      name,
      sport_type: sport_type || 'cricket',
      format: format || 'knockout',
      teams: teams || [],
      venue,
      overs: overs || 20,
      start_date: start_date ? new Date(start_date) : null,
      match_interval_hours: match_interval_hours || 24,
      created_by: req.user.user_id,
      status: 'draft',
      created_at: new Date()
    });

    await tournament.save();
    res.json(tournament.toObject({ versionKey: false }));
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ detail: 'Failed to create tournament' });
  }
});

// Update tournament
router.put('/:tournamentId', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ tournament_id: req.params.tournamentId });
    if (!tournament) {
      return res.status(404).json({ detail: 'Tournament not found' });
    }

    if (req.user.role === 'manager' && tournament.created_by !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const updated = await Tournament.findOneAndUpdate(
      { tournament_id: req.params.tournamentId },
      { $set: req.body },
      { new: true }
    ).select('-_id -__v');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update tournament' });
  }
});

// Add team to tournament
router.post('/:tournamentId/teams', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const { team_id } = req.body;
    const tournament = await Tournament.findOne({ tournament_id: req.params.tournamentId });

    if (!tournament) {
      return res.status(404).json({ detail: 'Tournament not found' });
    }
    if (tournament.status !== 'draft') {
      return res.status(400).json({ detail: 'Cannot modify non-draft tournament' });
    }

    if (!tournament.teams.includes(team_id)) {
      tournament.teams.push(team_id);
      await tournament.save();
    }

    res.json(tournament.toObject({ versionKey: false }));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to add team' });
  }
});

// Remove team from tournament
router.delete('/:tournamentId/teams/:teamId', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ tournament_id: req.params.tournamentId });

    if (!tournament) {
      return res.status(404).json({ detail: 'Tournament not found' });
    }
    if (tournament.status !== 'draft') {
      return res.status(400).json({ detail: 'Cannot modify non-draft tournament' });
    }

    tournament.teams = tournament.teams.filter(t => t !== req.params.teamId);
    await tournament.save();

    res.json(tournament.toObject({ versionKey: false }));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to remove team' });
  }
});

// Generate bracket and start tournament
router.post('/:tournamentId/generate-bracket', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ tournament_id: req.params.tournamentId });

    if (!tournament) {
      return res.status(404).json({ detail: 'Tournament not found' });
    }
    if (tournament.teams.length < 2) {
      return res.status(400).json({ detail: 'Need at least 2 teams' });
    }

    const numTeams = tournament.teams.length;
    const rounds = Math.ceil(Math.log2(numTeams));
    const bracketSize = Math.pow(2, rounds);

    const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);

    while (shuffledTeams.length < bracketSize) {
      shuffledTeams.push(null);
    }

    const bracket = {
      rounds,
      bracket_size: bracketSize,
      teams: shuffledTeams
    };

    const matches = [];
    const startDate = tournament.start_date || new Date();
    let matchDate = new Date(startDate);

    for (let i = 0; i < bracketSize / 2; i++) {
      const team1 = shuffledTeams[i * 2];
      const team2 = shuffledTeams[i * 2 + 1];

      matches.push({
        match_id: `match_${uuidv4().slice(0, 8)}`,
        tournament_id: tournament.tournament_id,
        team1_id: team1,
        team2_id: team2,
        round: 1,
        match_number: i + 1,
        scheduled_time: new Date(matchDate),
        status: team1 && team2 ? 'scheduled' : 'pending',
        created_at: new Date()
      });

      matchDate = new Date(matchDate.getTime() + tournament.match_interval_hours * 60 * 60 * 1000);
    }

    for (let round = 2; round <= rounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let i = 0; i < matchesInRound; i++) {
        matches.push({
          match_id: `match_${uuidv4().slice(0, 8)}`,
          tournament_id: tournament.tournament_id,
          team1_id: null,
          team2_id: null,
          round,
          match_number: i + 1,
          scheduled_time: new Date(matchDate),
          status: 'pending',
          created_at: new Date()
        });

        matchDate = new Date(matchDate.getTime() + tournament.match_interval_hours * 60 * 60 * 1000);
      }
    }

    await TournamentMatch.insertMany(matches);

    tournament.bracket_data = bracket;
    tournament.status = 'upcoming';
    await tournament.save();

    if (broadcastTournamentUpdate) {
      broadcastTournamentUpdate(tournament.tournament_id, { type: 'bracket_generated', tournament });
    }

    res.json({
      message: 'Bracket generated successfully',
      bracket,
      matches_created: matches.length
    });
  } catch (error) {
    console.error('Generate bracket error:', error);
    res.status(500).json({ detail: 'Failed to generate bracket' });
  }
});

// Get tournament matches
router.get('/:tournamentId/matches', async (req, res) => {
  try {
    const matches = await TournamentMatch.find({ tournament_id: req.params.tournamentId })
      .sort({ round: 1, match_number: 1 })
      .select('-_id -__v');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch matches' });
  }
});

module.exports = router;
