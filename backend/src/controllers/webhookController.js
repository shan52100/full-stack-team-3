import Conversation from '../models/Conversation.js';
import Agent from '../models/Agent.js';
import CallLog from '../models/CallLog.js';
import Settings from '../models/Settings.js';

/**
 * Handle LiveKit webhook events
 * LiveKit sends webhooks for room events, participant events, etc.
 */
export async function handleLivekitWebhook(req, res, next) {
  try {
    const event = req.body;
    console.log('LiveKit webhook event:', event.event, JSON.stringify(event, null, 2));

    switch (event.event) {
      case 'room_started':
        console.log(`Room started: ${event.room?.name}`);
        break;

      case 'room_finished':
        await handleRoomFinished(event);
        break;

      case 'participant_joined':
        console.log(`Participant joined: ${event.participant?.identity} in ${event.room?.name}`);
        break;

      case 'participant_left':
        console.log(`Participant left: ${event.participant?.identity} from ${event.room?.name}`);
        break;

      case 'track_published':
        console.log(`Track published: ${event.track?.type} by ${event.participant?.identity}`);
        break;

      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
}

async function handleRoomFinished(event) {
  const roomName = event.room?.name;
  if (!roomName) return;

  // Update any active call logs for this room to completed
  await CallLog.updateMany(
    { roomName, status: 'in-progress' },
    { status: 'completed', endedAt: new Date() }
  );
}

/**
 * Test a webhook URL by sending a test payload
 */
export async function testWebhook(req, res, next) {
  try {
    const settings = await Settings.findOne();
    const webhookUrl = settings?.webhooks?.url;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'No webhook URL configured' });
    }

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook from B2B Voice Agent Platform' },
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    res.json({
      success: response.ok,
      statusCode: response.status,
      message: response.ok ? 'Webhook test successful' : 'Webhook test failed',
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Webhook test failed: ${error.message}`,
    });
  }
}
