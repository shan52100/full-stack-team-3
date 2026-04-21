import {
  createOutboundCall,
  listRooms,
  listParticipants,
  endCall,
  getJoinToken,
  listOutboundTrunks,
} from '../services/livekitService.js';
import CallLog from '../models/CallLog.js';

/**
 * Initiate an outbound voice call via LiveKit SIP
 */
export async function initiateCall(req, res, next) {
  try {
    const { phoneNumber, agentId, agentName, customerName, roomName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    const result = await createOutboundCall({
      phoneNumber,
      roomName: roomName || `call-${Date.now()}`,
      agentId,
      agentName,
      customerName,
    });

    res.status(201).json({
      message: 'Call initiated successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * End an active call
 */
export async function terminateCall(req, res, next) {
  try {
    const { roomName, participantIdentity } = req.body;

    await endCall(roomName, participantIdentity);

    // Update call log
    await CallLog.findOneAndUpdate(
      { roomName, participantIdentity, status: 'in-progress' },
      { status: 'completed', endedAt: new Date() }
    );

    res.json({ message: 'Call terminated' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get active rooms (live calls)
 */
export async function getActiveRooms(req, res, next) {
  try {
    const rooms = await listRooms();
    res.json(rooms);
  } catch (error) {
    if (error.message.includes('not configured')) {
      return res.json([]);
    }
    next(error);
  }
}

/**
 * Get participants in a room
 */
export async function getRoomParticipants(req, res, next) {
  try {
    const participants = await listParticipants(req.params.roomName);
    res.json(participants);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a join token for web-based call participation
 */
export async function getCallToken(req, res, next) {
  try {
    const { roomName, identity, name } = req.body;
    const token = await getJoinToken(roomName, identity, name);
    res.json({ token, livekitUrl: process.env.LIVEKIT_URL });
  } catch (error) {
    next(error);
  }
}

/**
 * List SIP outbound trunks
 */
export async function getTrunks(req, res, next) {
  try {
    const trunks = await listOutboundTrunks();
    res.json(trunks);
  } catch (error) {
    if (error.message.includes('not configured')) {
      return res.json([]);
    }
    next(error);
  }
}
