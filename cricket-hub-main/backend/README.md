# Cricket League Management System - Backend API

A comprehensive backend API for managing cricket tournaments, teams, players, live scoring, and real-time chat features built with Node.js, Express, MongoDB, and Socket.IO.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Socket.IO Events](#socketio-events)
- [Authentication](#authentication)
- [Project Structure](#project-structure)

---

## Features

- **User Management**: Registration, login, role-based access control (Admin, Manager, Spectator)
- **Team Management**: CRUD operations for teams with manager assignments
- **Player Management**: Player profiles with career statistics
- **Tournament System**: Create knockout/round-robin tournaments with bracket generation
- **Live Match Scoring**: Real-time score updates with Socket.IO
- **Real-time Chat**: Match-specific chat rooms for live discussions
- **AI Predictions**: Player performance predictions using Google Gemini AI
- **Leaderboards**: Batting and bowling statistics rankings
- **Admin Panel**: User role management and system seeding

---

## Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **AI**: Google Generative AI (Gemini)
- **Others**: CORS, dotenv, axios, uuid

---

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager
- (Optional) Google Gemini API key for AI predictions

---

## Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables))

4. **Seed the database** (optional):
   ```bash
   node seed.js
   ```

5. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:8001` by default.

---

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=8001

# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=cricket_league

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secret-key-here-change-in-production

# Google Gemini AI (optional, for AI predictions)
GEMINI_API_KEY=your-gemini-api-key-here
```

### Important Notes:
- **JWT_SECRET**: Use a strong, random string in production
- **GEMINI_API_KEY**: Optional - only needed for AI prediction features
- **MONGO_URL**: Use MongoDB Atlas connection string for cloud deployment

---

## Database Setup

### Automatic Seeding

Run the seed script to clear the database and create initial admin and manager accounts:

```bash
node seed.js
```

This will:
- Clear all existing data
- Create an Admin account
- Create a Team Manager account
- Create a sample team

### Default Credentials

After seeding, you'll have these accounts:

**Admin Account:**
- Email: `admin@cricketleague.com`
- Password: `Admin@123`
- Role: `admin`

**Team Manager Account:**
- Email: `manager@cricketleague.com`
- Password: `Manager@123`
- Role: `manager`

### Database Schema

The system uses the following collections:

- **users**: User accounts with roles (admin, manager, spectator)
- **sessions**: User session tokens for authentication
- **teams**: Cricket teams with manager assignments
- **players**: Player profiles with career statistics
- **tournaments**: Tournament configurations and brackets
- **tournamentmatches**: Individual match data and scores
- **chatmessages**: Match-specific chat messages
- **predictions**: AI-generated player predictions

---

## API Documentation

### Base URL
```
http://localhost:8001/api
```

### Authentication

Most endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "spectator"  // admin, manager, spectator
}
```

**Response:**
```json
{
  "access_token": "jwt-token-here",
  "token_type": "bearer",
  "user": {
    "user_id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "spectator",
    "picture": null,
    "team_id": null
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@cricketleague.com",
  "password": "Admin@123"
}
```

**Response:** Same as registration

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
```

---

### Teams Endpoints

#### Get All Teams
```http
GET /api/teams
```

**Response:**
```json
[
  {
    "team_id": "team_abc123",
    "name": "Mumbai Indians",
    "short_name": "MI",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#004BA0",
    "secondary_color": "#18181b",
    "home_ground": "Wankhede Stadium",
    "manager_id": "user_xyz789",
    "matches_played": 10,
    "matches_won": 6,
    "matches_lost": 4,
    "points": 12,
    "net_run_rate": 0.75,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

#### Get Team by ID
```http
GET /api/teams/:teamId
```

#### Create Team (Manager/Admin)
```http
POST /api/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Team",
  "short_name": "NT",
  "home_ground": "Stadium Name",
  "primary_color": "#4ade80",
  "secondary_color": "#18181b"
}
```

#### Update Team (Manager/Admin)
```http
PUT /api/teams/:teamId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Team Name"
}
```

#### Delete Team (Manager/Admin)
```http
DELETE /api/teams/:teamId
Authorization: Bearer <token>
```

#### Get Team Players
```http
GET /api/teams/:teamId/players
```

---

### Players Endpoints

#### Get All Players
```http
GET /api/players
GET /api/players?team_id=team_abc123  // Filter by team
```

#### Get Player by ID
```http
GET /api/players/:playerId
```

**Response:**
```json
{
  "player_id": "player_xyz123",
  "name": "Rohit Sharma",
  "email": "rohit@team.com",
  "team_id": "team_abc123",
  "jersey_number": 45,
  "role": "batsman",
  "batting_style": "right-hand",
  "bowling_style": null,
  "profile_picture": "https://example.com/profile.jpg",
  "matches": 150,
  "runs": 5000,
  "balls_faced": 3500,
  "fours": 400,
  "sixes": 200,
  "highest_score": 150,
  "fifties": 30,
  "hundreds": 10,
  "wickets": 0,
  "catches": 50,
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

#### Create Player (Manager/Admin)
```http
POST /api/players
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Player",
  "team_id": "team_abc123",
  "jersey_number": 18,
  "role": "all-rounder",
  "batting_style": "right-hand",
  "bowling_style": "right-arm medium"
}
```

#### Update Player (Manager/Admin)
```http
PUT /api/players/:playerId
Authorization: Bearer <token>
```

#### Delete Player (Manager/Admin)
```http
DELETE /api/players/:playerId
Authorization: Bearer <token>
```

---

### Tournament Endpoints

#### Get All Tournaments
```http
GET /api/tournaments
GET /api/tournaments?status=live
GET /api/tournaments?sport_type=cricket
```

#### Get Tournament by ID
```http
GET /api/tournaments/:tournamentId
```

**Response includes tournament details, matches, and team details**

#### Create Tournament (Manager/Admin)
```http
POST /api/tournaments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "IPL 2025",
  "sport_type": "cricket",
  "format": "knockout",
  "teams": ["team_1", "team_2", "team_3", "team_4"],
  "venue": "Wankhede Stadium",
  "overs": 20,
  "start_date": "2025-03-15T10:00:00Z",
  "match_interval_hours": 24
}
```

#### Update Tournament (Manager/Admin)
```http
PUT /api/tournaments/:tournamentId
Authorization: Bearer <token>
```

#### Add Team to Tournament (Manager/Admin)
```http
POST /api/tournaments/:tournamentId/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "team_id": "team_abc123"
}
```

#### Remove Team from Tournament (Manager/Admin)
```http
DELETE /api/tournaments/:tournamentId/teams/:teamId
Authorization: Bearer <token>
```

#### Generate Tournament Bracket (Manager/Admin)
```http
POST /api/tournaments/:tournamentId/generate-bracket
Authorization: Bearer <token>
```

This creates all matches and schedules for the tournament.

#### Get Tournament Matches
```http
GET /api/tournaments/:tournamentId/matches
```

---

### Match Endpoints

#### Get Match Details
```http
GET /api/tournament-matches/:matchId
```

#### Start Match (Manager/Admin)
```http
POST /api/tournament-matches/:matchId/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "toss_winner": "team_abc123",
  "toss_decision": "bat"  // or "bowl"
}
```

#### Update Score (Manager/Admin)
```http
PUT /api/tournament-matches/:matchId/score
Authorization: Bearer <token>
Content-Type: application/json

{
  "innings": 1,  // 1 or 2
  "runs": 150,
  "wickets": 5,
  "overs": 18.3,
  "extras": 10
}
```

#### Switch Innings (Manager/Admin)
```http
POST /api/tournament-matches/:matchId/switch-innings
Authorization: Bearer <token>
```

#### End Match (Manager/Admin)
```http
POST /api/tournament-matches/:matchId/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "winner_id": "team_abc123",
  "result_summary": "Team ABC won by 25 runs",
  "man_of_match": "player_xyz123"
}
```

---

### Statistics Endpoints

#### Get Team Standings
```http
GET /api/stats/standings
```

#### Get Batting Leaderboard
```http
GET /api/stats/leaderboard/batting?limit=10
```

#### Get Bowling Leaderboard
```http
GET /api/stats/leaderboard/bowling?limit=10
```

---

### AI Endpoints

#### Get Player Prediction
```http
GET /api/ai/predict/:playerId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "prediction_id": "pred_abc123",
  "player_id": "player_xyz",
  "player_name": "Rohit Sharma",
  "prediction_text": "Based on recent form...",
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

---

### Admin Endpoints

#### Get All Users (Admin only)
```http
GET /api/admin/users
Authorization: Bearer <admin-token>
```

#### Update User Role (Admin only)
```http
PUT /api/admin/users/:userId/role?role=manager&team_id=team_123
Authorization: Bearer <admin-token>
```

#### Delete User (Admin only)
```http
DELETE /api/admin/users/:userId
Authorization: Bearer <admin-token>
```

#### Seed Sample Data (Admin only)
```http
POST /api/admin/seed-data
Authorization: Bearer <admin-token>
```

---

### Chat Endpoints

#### Get Match Chat Messages
```http
GET /api/chat/:matchId
```

**Response:**
```json
[
  {
    "message_id": "msg_abc123",
    "match_id": "match_xyz",
    "user_id": "user_123",
    "user_name": "John Doe",
    "user_picture": "https://...",
    "message": "Great shot!",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
]
```

---

## Socket.IO Events

### Client → Server Events

#### Join Match Room
```javascript
socket.emit('join_match', {
  match_id: 'match_abc123',
  user: {
    user_id: 'user_xyz',
    name: 'John Doe',
    picture: 'https://...'
  }
});
```

#### Join Tournament Room
```javascript
socket.emit('join_tournament', {
  tournament_id: 'tourn_abc123',
  user: { ... }
});
```

#### Send Chat Message
```javascript
socket.emit('send_message', {
  match_id: 'match_abc123',
  message: 'Great match!',
  user: { user_id: 'user_xyz', name: 'John Doe', picture: '...' }
});
```

#### Leave Match/Tournament
```javascript
socket.emit('leave_match', { match_id: 'match_abc123' });
socket.emit('leave_tournament', { tournament_id: 'tourn_abc123' });
```

### Server → Client Events

#### Recent Messages
```javascript
socket.on('recent_messages', (messages) => {
  // Array of last 50 chat messages
});
```

#### New Chat Message
```javascript
socket.on('new_message', (message) => {
  // Newly sent message
});
```

#### Viewer Count
```javascript
socket.on('viewer_count', (count) => {
  // Number of active viewers
});
```

#### Score Update
```javascript
socket.on('score_update', (matchData) => {
  // Real-time match score update
});
```

#### Match Update
```javascript
socket.on('match_update', (matchData) => {
  // Match status change
});
```

#### Tournament Update
```javascript
socket.on('tournament_update', (data) => {
  // Tournament-wide updates (bracket changes, etc.)
});
```

---

## Authentication

### Role-Based Access Control

Three user roles are supported:

1. **Admin**: Full system access
   - Manage all users, teams, tournaments
   - Access admin panel endpoints
   - Seed sample data

2. **Manager**: Team and tournament management
   - Create/update/delete own teams
   - Create tournaments
   - Manage matches they created
   - Add/update/delete players in their teams

3. **Spectator**: Read-only access
   - View teams, players, matches, tournaments
   - Participate in chat
   - View leaderboards and statistics

### Middleware

- `authenticate`: Verifies JWT token, attaches user to request
- `requireAdmin`: Ensures user has admin role
- `requireManagerOrAdmin`: Ensures user is manager or admin

---

## Project Structure

```
backend/
├── server.js           # Main application entry point
├── models.js           # Mongoose schemas and models
├── middleware.js       # Authentication & authorization middleware
├── seed.js             # Database seeding script
├── package.json        # Dependencies and scripts
├── .env                # Environment variables (create this)
└── README.md           # This file
```

### Key Files

- **server.js**: Express app setup, all API routes, Socket.IO handlers
- **models.js**: MongoDB schemas for User, Team, Player, Tournament, etc.
- **middleware.js**: JWT authentication and role checking
- **seed.js**: Database initialization with default admin/manager accounts

---

## Development

### Available Scripts

```bash
# Start server in production mode
npm start

# Start server with auto-reload (nodemon)
npm run dev

# Seed/reset database
node seed.js
```

### Adding New Features

1. **New API Route**: Add to `server.js` in appropriate section
2. **New Database Model**: Add schema to `models.js`
3. **New Socket Event**: Add handler in Socket.IO section of `server.js`
4. **New Middleware**: Add to `middleware.js`

---

## API Response Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication failed)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## Security Considerations

1. **JWT Secret**: Use a strong, random secret in production
2. **Password Hashing**: bcrypt with salt rounds of 10
3. **CORS**: Configure appropriate origins for production
4. **Environment Variables**: Never commit `.env` file
5. **Input Validation**: Validate all user inputs
6. **Rate Limiting**: Consider adding rate limiting middleware

---

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check Atlas connection
- Verify `MONGO_URL` in `.env`
- Check network/firewall settings

### Socket.IO Not Working
- Verify CORS settings in Socket.IO configuration
- Check client connection URL matches server

### JWT Authentication Failing
- Ensure `JWT_SECRET` is set in `.env`
- Check token is being sent in `Authorization: Bearer <token>` header
- Token may have expired (default 7 days)

### AI Predictions Not Working
- Verify `GEMINI_API_KEY` is set in `.env`
- Check API key is valid and has proper permissions
- Review Google Gemini API quota/limits

---

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check documentation at [project wiki]

---

## Changelog

### Version 2.0.0
- Complete tournament bracket system
- Real-time match scoring
- Socket.IO integration
- AI predictions with Gemini
- Role-based access control
- Database seeding script

---

**Built with ❤️ for cricket enthusiasts**
