const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Player, Team, Prediction } = require('../../models');
const { authenticate } = require('../../middleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Get AI prediction for a player
router.get('/predict/:playerId', authenticate, async (req, res) => {
  try {
    if (!genAI) {
      return res.status(400).json({ detail: 'AI service not configured' });
    }

    const player = await Player.findOne({ player_id: req.params.playerId });
    if (!player) {
      return res.status(404).json({ detail: 'Player not found' });
    }

    const team = await Team.findOne({ team_id: player.team_id });
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a cricket analyst AI. Based on the following player statistics, provide a brief performance prediction for their next match.

Player: ${player.name}
Team: ${team?.name || 'Unknown'}
Role: ${player.role}
Batting Style: ${player.batting_style}
Bowling Style: ${player.bowling_style || 'N/A'}

Career Statistics:
- Matches: ${player.matches}
- Runs: ${player.runs}
- Strike Rate: ${player.balls_faced > 0 ? ((player.runs / player.balls_faced) * 100).toFixed(2) : 0}
- Highest Score: ${player.highest_score}
- Wickets: ${player.wickets}
- Best Bowling: ${player.best_bowling}

Provide a concise prediction (3-4 sentences) including expected runs range and wickets if applicable.`;

    const result = await model.generateContent(prompt);

    const prediction = await Prediction.create({
      prediction_id: `pred_${uuidv4().slice(0, 8)}`,
      player_id: player.player_id,
      prediction_text: result.response.text(),
      created_at: new Date()
    });

    res.json({
      prediction_id: prediction.prediction_id,
      player_id: player.player_id,
      player_name: player.name,
      prediction_text: prediction.prediction_text,
      created_at: prediction.created_at
    });
  } catch (error) {
    console.error('AI prediction error:', error);
    res.status(500).json({ detail: 'Failed to generate prediction' });
  }
});

module.exports = router;
