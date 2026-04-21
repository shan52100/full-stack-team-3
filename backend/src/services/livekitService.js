import { sipClient, roomService, generateToken } from '../config/livekit.js';
import { logCallEvent } from '../middleware/requestLogger.js';

/**
 * Create an outbound SIP call via LiveKit
 * Reference: voiceagent-livekit/sip-participant.json
 */
export async function createOutboundCall({
  phoneNumber,
  roomName,
  agentId,
  agentName,
  customerName,
  sipTrunkId,
}) {
  if (!sipClient) {
    throw new Error('LiveKit SIP client not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET.');
  }

  const trunkId = sipTrunkId || process.env.SIP_TRUNK_ID;
  if (!trunkId) {
    throw new Error('SIP_TRUNK_ID not configured');
  }

  const participantIdentity = `sip-${phoneNumber.replace(/\+/g, '')}`;
  const participantName = customerName || 'Phone User';

  // Log call initiation
  const callLog = await logCallEvent({
    agent: agentId,
    agentName,
    customerName: participantName,
    customerPhone: phoneNumber,
    type: 'outbound',
    status: 'initiated',
    roomName,
    sipTrunkId: trunkId,
    sipCallTo: phoneNumber,
    participantIdentity,
    participantName,
  });

  try {
    const participant = await sipClient.createSipParticipant(
      trunkId,
      phoneNumber,
      roomName,
      {
        participantIdentity,
        participantName,
        krispEnabled: true,
        waitUntilAnswered: false,
      }
    );

    // Update call log to in-progress
    if (callLog) {
      callLog.status = 'in-progress';
      callLog.answeredAt = new Date();
      await callLog.save();
    }

    return {
      participant,
      callLogId: callLog?._id,
      roomName,
      participantIdentity,
    };
  } catch (error) {
    // Update call log to failed
    if (callLog) {
      callLog.status = 'failed';
      callLog.failureReason = error.message;
      callLog.endedAt = new Date();
      await callLog.save();
    }
    throw error;
  }
}

/**
 * List active LiveKit rooms
 */
export async function listRooms() {
  if (!roomService) {
    throw new Error('LiveKit room service not configured');
  }
  return roomService.listRooms();
}

/**
 * List participants in a room
 */
export async function listParticipants(roomName) {
  if (!roomService) {
    throw new Error('LiveKit room service not configured');
  }
  return roomService.listParticipants(roomName);
}

/**
 * End a call by removing the SIP participant from the room
 */
export async function endCall(roomName, participantIdentity) {
  if (!roomService) {
    throw new Error('LiveKit room service not configured');
  }
  return roomService.removeParticipant(roomName, participantIdentity);
}

/**
 * Generate a join token for a web participant
 */
export async function getJoinToken(roomName, participantIdentity, participantName) {
  return generateToken(roomName, participantIdentity, participantName);
}

/**
 * List outbound SIP trunks
 */
export async function listOutboundTrunks() {
  if (!sipClient) {
    throw new Error('LiveKit SIP client not configured');
  }
  return sipClient.listSipOutboundTrunk();
}
