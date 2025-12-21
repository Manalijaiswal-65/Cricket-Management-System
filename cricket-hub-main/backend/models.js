const mongoose = require('mongoose');

// User Schema - Removed player role
const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password_hash: { type: String },
  role: { type: String, enum: ['admin', 'manager', 'spectator'], default: 'spectator' },
  picture: { type: String },
  team_id: { type: String },
  created_at: { type: Date, default: Date.now }
});

// User Session Schema
const sessionSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  session_token: { type: String, required: true },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now }
});

// Team Schema
const teamSchema = new mongoose.Schema({
  team_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  short_name: { type: String, required: true },
  logo_url: { type: String },
  primary_color: { type: String, default: '#4ade80' },
  secondary_color: { type: String, default: '#18181b' },
  home_ground: { type: String },
  manager_id: { type: String },
  matches_played: { type: Number, default: 0 },
  matches_won: { type: Number, default: 0 },
  matches_lost: { type: Number, default: 0 },
  matches_drawn: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  net_run_rate: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

// Player Schema (players are managed by team managers, not user accounts)
const playerSchema = new mongoose.Schema({
  player_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String }, // Contact email for player
  team_id: { type: String, required: true },
  jersey_number: { type: Number, required: true },
  role: { type: String, required: true }, // batsman, bowler, all-rounder, wicket-keeper
  batting_style: { type: String, required: true },
  bowling_style: { type: String },
  profile_picture: { type: String },
  // Career Stats
  matches: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  balls_faced: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  highest_score: { type: Number, default: 0 },
  fifties: { type: Number, default: 0 },
  hundreds: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  balls_bowled: { type: Number, default: 0 },
  runs_conceded: { type: Number, default: 0 },
  best_bowling: { type: String, default: '0/0' },
  catches: { type: Number, default: 0 },
  stumpings: { type: Number, default: 0 },
  run_outs: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

// Tournament Schema
const tournamentSchema = new mongoose.Schema({
  tournament_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sport_type: { type: String, enum: ['cricket', 'football'], default: 'cricket' },
  format: { type: String, enum: ['knockout', 'round-robin', 'group-knockout'], default: 'knockout' },
  status: { type: String, enum: ['draft', 'upcoming', 'live', 'completed'], default: 'draft' },
  teams: [{ type: String }], // Array of team_ids
  created_by: { type: String, required: true }, // manager user_id
  start_date: { type: Date },
  end_date: { type: Date },
  venue: { type: String },
  overs: { type: Number, default: 20 },
  match_interval_hours: { type: Number, default: 24 }, // Time between matches
  bracket_data: { type: mongoose.Schema.Types.Mixed }, // Stores bracket structure
  current_round: { type: Number, default: 1 },
  winner_id: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Tournament Match Schema
const tournamentMatchSchema = new mongoose.Schema({
  match_id: { type: String, required: true, unique: true },
  tournament_id: { type: String, required: true, index: true },
  round: { type: Number, required: true },
  match_number: { type: Number, required: true },
  team1_id: { type: String },
  team2_id: { type: String },
  venue: { type: String },
  match_date: { type: Date },
  overs: { type: Number, default: 20 },
  match_type: { type: String, default: 'T20' },
  status: { type: String, enum: ['pending', 'scheduled', 'live', 'completed', 'cancelled'], default: 'pending' },
  toss_winner: { type: String },
  toss_decision: { type: String },
  innings1: {
    batting_team_id: { type: String },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    extras: { type: Number, default: 0 },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' }
  },
  innings2: {
    batting_team_id: { type: String },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    extras: { type: Number, default: 0 },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' }
  },
  winner_id: { type: String },
  result_summary: { type: String },
  man_of_match: { type: String },
  next_match_id: { type: String }, // For bracket progression
  bracket_position: { type: String }, // e.g., "QF1", "SF1", "F"
  created_at: { type: Date, default: Date.now }
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  message_id: { type: String, required: true, unique: true },
  match_id: { type: String, required: true, index: true },
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  user_picture: { type: String },
  message: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// AI Prediction Schema
const predictionSchema = new mongoose.Schema({
  prediction_id: { type: String, required: true, unique: true },
  player_id: { type: String },
  match_id: { type: String },
  prediction_text: { type: String, required: true },
  predicted_runs: { type: Number },
  predicted_wickets: { type: Number },
  confidence: { type: String },
  created_at: { type: Date, default: Date.now }
});

// Export models
const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);
const Team = mongoose.model('Team', teamSchema);
const Player = mongoose.model('Player', playerSchema);
const Tournament = mongoose.model('Tournament', tournamentSchema);
const TournamentMatch = mongoose.model('TournamentMatch', tournamentMatchSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const Prediction = mongoose.model('Prediction', predictionSchema);

module.exports = {
  User,
  Session,
  Team,
  Player,
  Tournament,
  TournamentMatch,
  ChatMessage,
  Prediction
};
