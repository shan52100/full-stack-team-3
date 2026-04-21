import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/db.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Route imports
import authRoutes from './src/routes/auth.js';
import agentRoutes from './src/routes/agents.js';
import conversationRoutes from './src/routes/conversations.js';
import analyticsRoutes from './src/routes/analytics.js';
import settingsRoutes from './src/routes/settings.js';
import teamRoutes from './src/routes/team.js';
import callRoutes from './src/routes/calls.js';
import logRoutes from './src/routes/logs.js';
import webhookRoutes from './src/routes/webhooks.js';
import memberRoutes from './src/routes/members.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(requestLogger);

// Serve uploaded member images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/members', memberRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
