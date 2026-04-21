import { RoomServiceClient, SipClient, AgentDispatchClient, AccessToken } from 'livekit-server-sdk';

const livekitUrl = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

export const roomService = livekitUrl && apiKey && apiSecret
  ? new RoomServiceClient(livekitUrl, apiKey, apiSecret)
  : null;

export const sipClient = livekitUrl && apiKey && apiSecret
  ? new SipClient(livekitUrl, apiKey, apiSecret)
  : null;

export const agentDispatchClient = livekitUrl && apiKey && apiSecret
  ? new AgentDispatchClient(livekitUrl, apiKey, apiSecret)
  : null;

export function generateToken(roomName, participantIdentity, participantName) {
  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials not configured');
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
}

export { livekitUrl, apiKey, apiSecret };
