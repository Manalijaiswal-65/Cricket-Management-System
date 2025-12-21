# Cricket League Management System

## Original Problem Statement
Build a complete web-based Sports League Management System for Cricket. Features: Node.js/Express backend, JWT + Google OAuth authentication, role-based access, team/player management, match scheduling, live chat on match pages, AI-powered player performance predictions.

## Architecture & Tech Stack

### Backend (Node.js/Express)
- Express.js server with RESTful API
- MongoDB with Mongoose ODM
- Socket.IO for real-time live chat
- JWT authentication with bcryptjs
- Google Generative AI (Gemini) for predictions

### Frontend (React)
- React.js with React Router
- Tailwind CSS with custom dark theme
- Socket.IO client for real-time chat
- shadcn/ui components
- Axios for API calls

### Database
- MongoDB Atlas

## Features Implemented

### Authentication
- JWT-based email/password login/register
- Google OAuth via Emergent Auth
- Role-based access control (Admin, Manager, Player, Spectator)

### Team Management
- CRUD operations for teams
- Team stats (matches, wins, losses, points)
- Team color customization

### Player Management
- CRUD operations for players
- Detailed player statistics
- Batting/Bowling/Fielding stats

### Match Management
- Manual match scheduling
- Auto round-robin schedule generation
- Match start/score update/end flow
- Live score broadcasting via Socket.IO

### Live Chat (YouTube-style)
- Real-time chat on match detail pages
- Chat panel on left side of match view
- Viewer count display
- Message history persistence

### AI Predictions (Requires Gemini API Key)
- Player performance predictions
- Match outcome predictions
- Based on historical stats

### Leaderboards
- League standings table
- Top batters leaderboard
- Top bowlers leaderboard

## API Endpoints

### Auth
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login with email/password
- POST `/api/auth/session` - OAuth session processing
- GET `/api/auth/me` - Get current user
- POST `/api/auth/logout` - Logout

### Teams
- GET `/api/teams` - List all teams
- GET `/api/teams/:teamId` - Get team details
- POST `/api/teams` - Create team (admin)
- PUT `/api/teams/:teamId` - Update team
- DELETE `/api/teams/:teamId` - Delete team (admin)
- GET `/api/teams/:teamId/players` - Get team players

### Players
- GET `/api/players` - List all players
- GET `/api/players/:playerId` - Get player details
- POST `/api/players` - Create player (admin/manager)
- PUT `/api/players/:playerId` - Update player
- DELETE `/api/players/:playerId` - Delete player

### Matches
- GET `/api/matches` - List all matches
- GET `/api/matches/live` - Get live matches
- GET `/api/matches/upcoming` - Get upcoming matches
- GET `/api/matches/:matchId` - Get match details
- POST `/api/matches` - Create match (admin)
- POST `/api/matches/:matchId/start` - Start match
- PUT `/api/matches/:matchId/score` - Update score
- POST `/api/matches/:matchId/switch-innings` - Switch innings
- POST `/api/matches/:matchId/end` - End match
- POST `/api/matches/generate-schedule` - Generate round-robin

### Stats
- GET `/api/stats/standings` - League standings
- GET `/api/stats/leaderboard/batting` - Batting leaderboard
- GET `/api/stats/leaderboard/bowling` - Bowling leaderboard

### AI Predictions
- GET `/api/ai/predict/:playerId` - Player prediction
- GET `/api/ai/match-prediction/:matchId` - Match prediction

### Chat
- GET `/api/chat/:matchId` - Get chat messages

### Admin
- GET `/api/admin/users` - List users (admin)
- PUT `/api/admin/users/:userId/role` - Update user role
- DELETE `/api/admin/users/:userId` - Delete user
- POST `/api/admin/seed-data` - Seed sample data

## Socket.IO Events
- `join_match` - Join match chat room
- `leave_match` - Leave match chat room
- `send_message` - Send chat message
- `new_message` - Receive new message
- `viewer_count` - Get viewer count
- `score_update` - Receive score updates
- `recent_messages` - Get recent messages

## Next Action Items
1. Add GEMINI_API_KEY to enable AI predictions
2. Add player-to-user account linking
3. Add ball-by-ball match commentary
4. Add notification system
5. Add player transfer feature
6. Export stats to CSV/PDF

## Environment Variables Required
```
MONGO_URL=mongodb+srv://...
DB_NAME=cricket_league
JWT_SECRET=your_secret
JWT_EXPIRATION=24h
PORT=8001
GEMINI_API_KEY=your_gemini_key (optional - for AI)
```
