const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Player, Team } = require('../../models');
const { authenticate, requireManagerOrAdmin } = require('../../middleware');

const router = express.Router();

// Get all players
router.get('/', async (req, res) => {
  try {
    const query = req.query.team_id ? { team_id: req.query.team_id } : {};
    const players = await Player.find(query).select('-_id -__v');
    res.json(players);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch players' });
  }
});

// Get player by ID
router.get('/:playerId', async (req, res) => {
  try {
    const player = await Player.findOne({ player_id: req.params.playerId }).select('-_id -__v');
    if (!player) {
      return res.status(404).json({ detail: 'Player not found' });
    }
    res.json(player);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch player' });
  }
});

// Create player
router.post('/', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const team = await Team.findOne({ team_id: req.body.team_id });
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    if (req.user.role === 'manager' && team.manager_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const player_id = `player_${uuidv4().slice(0, 8)}`;
    const player = new Player({
      player_id,
      ...req.body,
      created_at: new Date()
    });
    await player.save();
    res.json(player.toObject({ versionKey: false }));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to create player' });
  }
});

// Update player
router.put('/:playerId', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const player = await Player.findOne({ player_id: req.params.playerId });
    if (!player) {
      return res.status(404).json({ detail: 'Player not found' });
    }

    const team = await Team.findOne({ team_id: player.team_id });
    if (req.user.role === 'manager' && team?.manager_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const updated = await Player.findOneAndUpdate(
      { player_id: req.params.playerId },
      { $set: req.body },
      { new: true }
    ).select('-_id -__v');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update player' });
  }
});

// Delete player
router.delete('/:playerId', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const player = await Player.findOne({ player_id: req.params.playerId });
    if (!player) {
      return res.status(404).json({ detail: 'Player not found' });
    }

    const team = await Team.findOne({ team_id: player.team_id });
    if (req.user.role === 'manager' && team?.manager_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    await Player.deleteOne({ player_id: req.params.playerId });
    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete player' });
  }
});

module.exports = router;
