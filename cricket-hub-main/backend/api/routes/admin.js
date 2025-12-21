const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { User, Session } = require('../../models');
const { authenticate, requireAdmin } = require('../../middleware');

const router = express.Router();

// Get all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-_id -__v -password_hash');
    res.json(users);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch users' });
  }
});

// Update user role
router.put('/users/:userId/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role, team_id } = req.query;
    const validRoles = ['admin', 'manager', 'spectator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ detail: 'Invalid role' });
    }

    const updateData = { role };
    if (team_id) updateData.team_id = team_id;

    const result = await User.updateOne({ user_id: req.params.userId }, { $set: updateData });
    if (result.matchedCount === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to update role' });
  }
});

// Delete user
router.delete('/users/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.user.user_id === req.params.userId) {
      return res.status(400).json({ detail: 'Cannot delete your own account' });
    }

    const result = await User.deleteOne({ user_id: req.params.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }

    await Session.deleteMany({ user_id: req.params.userId });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to delete user' });
  }
});

// Seed database with sample data
router.post('/seed-data', authenticate, requireAdmin, async (req, res) => {
  try {
    const { Team, Player } = require('../../models');

    const existingTeams = await Team.countDocuments();
    if (existingTeams > 0) {
      return res.status(400).json({ detail: 'Database already has teams' });
    }

    const teamsData = [
      { name: 'Mumbai Indians', short_name: 'MI', primary_color: '#004BA0', home_ground: 'Wankhede Stadium' },
      { name: 'Chennai Super Kings', short_name: 'CSK', primary_color: '#F9CD05', home_ground: 'MA Chidambaram Stadium' },
      { name: 'Royal Challengers', short_name: 'RCB', primary_color: '#EC1C24', home_ground: 'M. Chinnaswamy Stadium' },
      { name: 'Kolkata Knight Riders', short_name: 'KKR', primary_color: '#3A225D', home_ground: 'Eden Gardens' },
      { name: 'Delhi Capitals', short_name: 'DC', primary_color: '#0078BC', home_ground: 'Arun Jaitley Stadium' },
      { name: 'Rajasthan Royals', short_name: 'RR', primary_color: '#EA1A85', home_ground: 'Sawai Mansingh Stadium' },
      { name: 'Punjab Kings', short_name: 'PBKS', primary_color: '#ED1B24', home_ground: 'IS Bindra Stadium' },
      { name: 'Sunrisers Hyderabad', short_name: 'SRH', primary_color: '#FF822A', home_ground: 'Rajiv Gandhi Stadium' },
    ];

    const createdTeams = [];
    for (const team of teamsData) {
      const team_id = `team_${uuidv4().slice(0, 8)}`;
      const newTeam = new Team({
        team_id,
        ...team,
        manager_id: req.user.user_id,
        created_at: new Date()
      });
      createdTeams.push(await newTeam.save());
    }

    res.json({ message: 'Seed data created successfully', teams_created: createdTeams.length });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ detail: 'Failed to seed data' });
  }
});

module.exports = router;
