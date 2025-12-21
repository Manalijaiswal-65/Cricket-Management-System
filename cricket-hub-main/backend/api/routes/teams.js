const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Team, Player } = require('../../models');
const { authenticate, requireManagerOrAdmin } = require('../../middleware');

const router = express.Router();

// Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().select('-_id -__v');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch teams' });
  }
});

// Get team by ID
router.get('/:teamId', async (req, res) => {
  try {
    const team = await Team.findOne({ team_id: req.params.teamId }).select('-_id -__v');
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch team' });
  }
});

// Create team
router.post('/', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const team_id = `team_${uuidv4().slice(0, 8)}`;
    const team = new Team({
      team_id,
      ...req.body,
      manager_id: req.user.user_id,
      created_at: new Date()
    });
    await team.save();
    res.json(team.toObject({ versionKey: false }));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to create team' });
  }
});

// Update team
router.put('/:teamId', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const team = await Team.findOne({ team_id: req.params.teamId });
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    if (req.user.role === 'manager' && team.manager_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    const updated = await Team.findOneAndUpdate(
      { team_id: req.params.teamId },
      { $set: req.body },
      { new: true }
    ).select('-_id -__v');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update team' });
  }
});

// Delete team
router.delete('/:teamId', authenticate, requireManagerOrAdmin, async (req, res) => {
  try {
    const team = await Team.findOne({ team_id: req.params.teamId });
    if (!team) {
      return res.status(404).json({ detail: 'Team not found' });
    }

    if (req.user.role === 'manager' && team.manager_id !== req.user.user_id) {
      return res.status(403).json({ detail: 'Not authorized' });
    }

    await Team.deleteOne({ team_id: req.params.teamId });
    await Player.deleteMany({ team_id: req.params.teamId });
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete team' });
  }
});

// Get team players
router.get('/:teamId/players', async (req, res) => {
  try {
    const players = await Player.find({ team_id: req.params.teamId }).select('-_id -__v');
    res.json(players);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch players' });
  }
});

module.exports = router;
