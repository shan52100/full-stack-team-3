import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import Agent from '../models/Agent.js';
import Conversation from '../models/Conversation.js';
import { createOutboundCall } from '../services/livekitService.js';
import { roomService, agentDispatchClient } from '../config/livekit.js';
import sseEmitter from '../utils/sseEmitter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve: controllers → src → backend → project root → voiceagent-livekit
const AGENT_DIR = path.join(__dirname, '..', '..', '..', 'voiceagent-livekit');

// Track the single agent worker process
let agentWorkerProc = null;
let agentWorkerRunning = false;

/**
 * Start the Python agent worker in dev mode (one persistent process).
 * The worker registers with LiveKit and handles dispatched jobs.
 */
export function ensureAgentWorkerRunning() {
  if (agentWorkerRunning && agentWorkerProc && !agentWorkerProc.killed) {
    return;
  }
  console.log('[Agent Worker] Starting Python agent worker in dev mode...');
  console.log('[Agent Worker] Agent dir:', AGENT_DIR);

  // Use shell: true on Windows so it resolves PATH and handles paths correctly
  const cmd = `cd "${AGENT_DIR}" && uv run python src/agent.py dev`;
  agentWorkerProc = spawn(cmd, [], {
    shell: true,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  agentWorkerRunning = true;

  agentWorkerProc.stdout.on('data', (data) => {
    console.log(`[Agent Worker] ${data.toString().trim()}`);
  });
  agentWorkerProc.stderr.on('data', (data) => {
    console.log(`[Agent Worker] ${data.toString().trim()}`);
  });
  agentWorkerProc.on('error', (err) => {
    console.error(`[Agent Worker] Failed to start: ${err.message}`);
    agentWorkerRunning = false;
    agentWorkerProc = null;
  });
  agentWorkerProc.on('exit', (code) => {
    console.log(`[Agent Worker] Process exited with code ${code}`);
    agentWorkerRunning = false;
    agentWorkerProc = null;
  });
}

export async function streamAgents(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const userId = req.user._id;

  const send = async (eventType = 'update') => {
    try {
      const agents = await Agent.find({ createdBy: userId }).sort({ createdAt: -1 });
      res.write(`event: ${eventType}\ndata: ${JSON.stringify({ agents })}\n\n`);
    } catch (_) {}
  };

  await send('init');

  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: {}\n\n`);
  }, 10000);

  const onUpdate = (uid) => {
    if (uid.toString() === userId.toString()) send('update');
  };
  sseEmitter.on('agents_update', onUpdate);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseEmitter.off('agents_update', onUpdate);
    res.end();
  });
}

export async function getAgents(req, res, next) {
  try {
    const agents = await Agent.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json(agents);
  } catch (error) {
    next(error);
  }
}

export async function getAgent(req, res, next) {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    res.json(agent);
  } catch (error) {
    next(error);
  }
}

export async function createAgent(req, res, next) {
  try {
    const { name, type, language, voice, instructions, phoneNumber } = req.body;

    const agent = await Agent.create({
      name,
      type,
      language: language || 'English',
      voice: voice || 'Professional Male',
      instructions: instructions || '',
      phoneNumber: phoneNumber || '',
      status: 'active',
      createdBy: req.user?._id,
    });

    // Start the agent worker when an agent is created (idempotent — only starts once)
    ensureAgentWorkerRunning();

    if (agent.createdBy) sseEmitter.emit('agents_update', agent.createdBy);
    res.status(201).json(agent);
  } catch (error) {
    next(error);
  }
}

export async function updateAgent(req, res, next) {
  try {
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.createdBy) sseEmitter.emit('agents_update', agent.createdBy);
    res.json(agent);
  } catch (error) {
    next(error);
  }
}

export async function deleteAgent(req, res, next) {
  try {
    const agent = await Agent.findByIdAndDelete(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    if (agent.createdBy) sseEmitter.emit('agents_update', agent.createdBy);
    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function toggleAgentStatus(req, res, next) {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.status = agent.status === 'active' ? 'inactive' : 'active';
    await agent.save();
    sseEmitter.emit('stats_update', agent.createdBy);
    sseEmitter.emit('agents_update', agent.createdBy);

    res.json(agent);
  } catch (error) {
    next(error);
  }
}

/**
 * Start a call from an agent:
 * 1. Ensure the Python agent worker is running
 * 2. Create LiveKit room with metadata (custom system prompt)
 * 3. Dispatch the agent into the room
 * 4. Create SIP participant to call the phone number
 *
 * Follows: CLAUDE.md "lk dispatch create" → "lk sip participant create" pattern
 */
export async function startCall(req, res, next) {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Accept phone override from request body, fallback to agent's stored number
    const phoneNumber = (req.body.phoneNumber && req.body.phoneNumber.trim()) || agent.phoneNumber;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required to place a call' });
    }

    // 1. Ensure agent worker is running
    ensureAgentWorkerRunning();

    const roomName = `agent-${agent._id}-${Date.now()}`;

    // 2. Create room with metadata containing agent instructions
    const metadata = JSON.stringify({
      agentId: agent._id.toString(),
      agentName: agent.name,
      instructions: agent.instructions || `You are ${agent.name}, a ${agent.type} voice AI assistant. Be helpful and professional.`,
      agentType: agent.type,
      language: agent.language,
    });

    if (roomService) {
      await roomService.createRoom({
        name: roomName,
        metadata,
      });
    }

    // 3. Dispatch the agent into the room (equivalent to: lk dispatch create --room <room> --agent-name my-agent)
    if (agentDispatchClient) {
      await agentDispatchClient.createDispatch(roomName, 'my-agent');
      console.log(`[Dispatch] Agent dispatched to room: ${roomName}`);
    }

    // 4. Create SIP participant to call the phone (equivalent to: lk sip participant create sip-participant.json)
    const result = await createOutboundCall({
      phoneNumber,
      roomName,
      agentId: agent._id,
      agentName: agent.name,
      customerName: 'Phone User',
    });

    // 5. Create a Conversation record so dashboard + conversations page show this call
    const conversation = await Conversation.create({
      agent: agent._id,
      agentName: agent.name,
      customerName: 'Phone User',
      customerPhone: phoneNumber,
      roomName,
      participantIdentity: result.participantIdentity,
      duration: '0:00',
      durationSeconds: 0,
      outcome: 'success',
      sentiment: 'neutral',
      summary: `Outbound call to ${phoneNumber}`,
      transcript: [],
      createdBy: req.user._id,
    });

    // Update agent stats
    agent.callsHandled += 1;
    agent.status = 'active';
    await agent.save();
    sseEmitter.emit('agents_update', req.user._id);

    res.json({
      message: `Calling ${phoneNumber}...`,
      roomName,
      conversationId: conversation._id,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}
