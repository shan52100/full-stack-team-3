# B2B Voice Agent Platform

A full-stack AI-powered voice agent platform that lets businesses deploy, manage, and monitor outbound voice agents that call customers and hold natural conversations in real-time.

## Team

| Name | Registration Number |
|------|-------------------|
| Shanmugapriyan | RA2312704010012 |
| Arun Raj | RA2312704010011 |
| Tejaswini Baskar | RA2312704010042 |

## Features

- **AI Voice Agents** — deploy agents with custom names, voices, and instructions
- **Outbound SIP Calling** — call any phone number worldwide via LiveKit SIP trunking
- **Real-time Dashboard** — live call stats, auto-refreshes every 15 seconds
- **Full Transcripts** — TTS-aligned conversation logs with sentiment analysis
- **Per-user Isolation** — each account sees only its own agents and conversations
- **Team Members** — register and manage team profiles with photo upload
- **Google OAuth** — sign in with Google in addition to email/password
- **Analytics** — call volume, success rate, duration charts
- **Landing Page** — public-facing page before login

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, MongoDB/Mongoose |
| Voice AI | LiveKit Agents SDK (Python), Groq LLM, Deepgram STT, Cartesia TTS |
| Auth | JWT + Google OAuth 2.0 |
| File Upload | Multer (member photos) |

## Project Structure

```
B2B-Voice-Agent-Platform/
├── src/                    # React frontend (TypeScript)
│   └── app/
│       ├── pages/          # Landing, Login, Dashboard, Agents, Members, etc.
│       ├── components/     # Shared UI components
│       ├── context/        # AuthContext
│       ├── layouts/        # MainLayout (sidebar)
│       └── services/       # API service layer
├── backend/                # Express API server
│   └── src/
│       ├── models/         # Mongoose models (User, Agent, Conversation, Member)
│       ├── routes/         # API routes
│       ├── controllers/    # Route handlers
│       └── middleware/     # Auth (protect), error handler
├── voiceagent-livekit/     # Python voice agent
│   └── src/agent.py        # LiveKit agent (Groq LLM + Deepgram STT + Cartesia TTS)
└── package.json            # Frontend dependencies
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Python 3.11+ with `uv` (for voice agent)

### 1. Clone and install

```bash
git clone https://github.com/shan52100/full-stack-team-3.git
cd full-stack-team-3

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env and fill in your API keys (see below)
```

### 3. API Keys needed

| Service | Where to get |
|---------|-------------|
| MongoDB URI | Local: `mongodb://localhost:27017/voice_agent_platform` or [MongoDB Atlas](https://atlas.mongodb.com) |
| JWT Secret | Any random string |
| LiveKit | [cloud.livekit.io](https://cloud.livekit.io) |
| Deepgram | [console.deepgram.com](https://console.deepgram.com) |
| Cartesia | [play.cartesia.ai](https://play.cartesia.ai) |
| Groq | [console.groq.com](https://console.groq.com) |
| Google OAuth | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials |

### 4. Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Click **Create Credentials** → **OAuth 2.0 Client ID** → **Web application**
4. Add Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
5. Copy the Client ID and Client Secret into `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

### 5. Run the app

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# Runs on http://localhost:5173
```

**Terminal 3 — Voice Agent (optional, for live calls):**
```bash
cd voiceagent-livekit
uv run python src/agent.py dev
```

### 6. First login

- Open `http://localhost:5173`
- Click **Get started** or **Sign in**
- Register a new account or use Google sign-in
- Default test credentials (if seeded): `shan@b2b.com` / `shan1234`

## Adding Team Members

1. Log in to the platform
2. Click **Members** in the sidebar
3. Click **Add Member**
4. Fill in:
   - Full Name, Roll Number, Year, Degree
   - Email, Role, Project
   - Hobbies, Certifications, Internship
   - About & Aim
   - Upload a profile photo (optional)
5. Click **Add Member** — they appear on the Members page instantly

## Team Member Registration Numbers

| Member | Roll Number |
|--------|-------------|
| Shanmugapriyan | RA2312704010012 |
| Arun Raj | RA2312704010011 |
| Tejaswini Baskar | RA2312704010042 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/agents` | List agents (auth required) |
| POST | `/api/agents` | Create agent |
| POST | `/api/agents/:id/call` | Trigger outbound call |
| GET | `/api/conversations` | List conversations |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/members` | List team members |
| POST | `/api/members` | Add member (with photo) |
| GET | `/api/members/:id` | Get member details |
| DELETE | `/api/members/:id` | Delete member |
