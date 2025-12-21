const express = require('express');
const { ChatMessage } = require('../../models');

const router = express.Router();

// Get chat messages for a match
router.get('/:matchId', async (req, res) => {
  try {
    const messages = await ChatMessage.find({ match_id: req.params.matchId })
      .sort({ created_at: -1 })
      .limit(100)
      .select('-_id -__v');

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch messages' });
  }
});

module.exports = router;
