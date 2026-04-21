import asyncio
import json
import logging
import os
import time
import urllib.request
import wave

import numpy as np
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    TurnHandlingOptions,
    cli,
    room_io,
)
from livekit.plugins import cartesia, deepgram, noise_cancellation, openai, silero
from livekit.plugins.turn_detector.english import EnglishModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

SAMPLE_RATE = 48000
NUM_CHANNELS = 1
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "output")


class AudioRecorder:
    """Records user and agent audio from the room, saves as separate + mixed WAV files."""

    def __init__(self, room_name: str):
        self.room_name = room_name
        self.user_frames: list[bytes] = []
        self.agent_frames: list[bytes] = []
        self._recording = False
        self._tasks: list[asyncio.Task] = []

    async def start(self, room: rtc.Room, local_participant_identity: str):
        """Start recording all audio tracks in the room."""
        self._recording = True
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Record existing tracks
        for participant in room.remote_participants.values():
            for track_pub in participant.track_publications.values():
                if track_pub.track and track_pub.kind == rtc.TrackKind.KIND_AUDIO:
                    is_agent = participant.identity == local_participant_identity
                    self._start_track_recording(track_pub.track, is_agent)

        # Listen for new tracks
        @room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.RemoteTrackPublication,
            participant: rtc.RemoteParticipant,
        ):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                is_agent = participant.identity == local_participant_identity
                self._start_track_recording(track, is_agent)
                logger.info(
                    f"Recording {'agent' if is_agent else 'user'} track: {participant.identity}"
                )

        # Also capture agent's own published audio
        @room.on("local_track_published")
        def on_local_published(
            publication: rtc.LocalTrackPublication,
            track: rtc.LocalTrack,
        ):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                self._start_track_recording(track, is_agent=True)
                logger.info("Recording agent's own audio track")

        logger.info("Audio recorder started")

    def _start_track_recording(self, track: rtc.Track, is_agent: bool):
        task = asyncio.create_task(self._record_track(track, is_agent))
        self._tasks.append(task)

    async def _record_track(self, track: rtc.Track, is_agent: bool):
        stream = rtc.AudioStream(
            track, sample_rate=SAMPLE_RATE, num_channels=NUM_CHANNELS
        )
        target = self.agent_frames if is_agent else self.user_frames
        try:
            async for event in stream:
                if not self._recording:
                    break
                target.append(event.frame.data.tobytes())
        except Exception as e:
            logger.warning(f"Track recording ended: {e}")

    def stop_and_save(self) -> dict[str, str]:
        """Stop recording and save WAV files. Returns dict of saved file paths."""
        self._recording = False
        for task in self._tasks:
            task.cancel()

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        prefix = f"{self.room_name}_{timestamp}"
        saved = {}

        # Save user audio
        if self.user_frames:
            path = os.path.join(OUTPUT_DIR, f"{prefix}_user.wav")
            self._save_wav(path, self.user_frames)
            saved["user"] = path
            logger.info(f"Saved user audio: {path}")

        # Save agent audio
        if self.agent_frames:
            path = os.path.join(OUTPUT_DIR, f"{prefix}_agent.wav")
            self._save_wav(path, self.agent_frames)
            saved["agent"] = path
            logger.info(f"Saved agent audio: {path}")

        # Save mixed audio (both channels combined)
        if self.user_frames or self.agent_frames:
            path = os.path.join(OUTPUT_DIR, f"{prefix}_mixed.wav")
            self._save_mixed_wav(path, self.user_frames, self.agent_frames)
            saved["mixed"] = path
            logger.info(f"Saved mixed audio: {path}")

        return saved

    def _save_wav(self, path: str, frames: list[bytes]):
        with wave.open(path, "wb") as wf:
            wf.setnchannels(NUM_CHANNELS)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(b"".join(frames))

    def _save_mixed_wav(
        self, path: str, user_frames: list[bytes], agent_frames: list[bytes]
    ):
        user_data = b"".join(user_frames) if user_frames else b""
        agent_data = b"".join(agent_frames) if agent_frames else b""

        # Pad shorter track with silence
        max_len = max(len(user_data), len(agent_data))
        user_data = user_data.ljust(max_len, b"\x00")
        agent_data = agent_data.ljust(max_len, b"\x00")

        # Mix: convert to int16 arrays, average, clip
        user_arr = np.frombuffer(user_data, dtype=np.int16).astype(np.float32)
        agent_arr = np.frombuffer(agent_data, dtype=np.int16).astype(np.float32)
        mixed = np.clip(user_arr + agent_arr, -32768, 32767).astype(np.int16)

        with wave.open(path, "wb") as wf:
            wf.setnchannels(NUM_CHANNELS)
            wf.setsampwidth(2)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(mixed.tobytes())


DEFAULT_INSTRUCTIONS = """You are a helpful voice AI assistant. The user is interacting with you via voice, even if you perceive the conversation as text.
You eagerly assist users with their questions by providing information from your extensive knowledge.
Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
You are curious, friendly, and have a sense of humor.

Important: If the user says short things like "mm-hmm", "yeah", "okay" while you are speaking, those are backchannels - do not stop talking.
Only stop when the user clearly starts a new sentence or question."""


class Assistant(Agent):
    def __init__(self, instructions: str | None = None) -> None:
        super().__init__(
            instructions=instructions or DEFAULT_INSTRUCTIONS,
        )


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load(
        min_speech_duration=0.1,
        min_silence_duration=0.4,
        prefix_padding_duration=0.2,
        max_buffered_speech=30.0,
    )


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Read custom instructions from room metadata (set by the backend)
    custom_instructions = None
    agent_name = "AI Assistant"
    if ctx.room.metadata:
        try:
            meta = json.loads(ctx.room.metadata)
            custom_instructions = meta.get("instructions")
            agent_name = meta.get("agentName", agent_name)
            logger.info(f"Room metadata loaded — agent: {agent_name}, has custom instructions: {bool(custom_instructions)}")
        except json.JSONDecodeError:
            logger.warning("Could not parse room metadata as JSON")

    # Set up audio recorder
    recorder = AudioRecorder(ctx.room.name)

    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="en"),
        llm=openai.LLM(
            model="llama-3.3-70b-versatile",
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY"),
        ),
        tts=cartesia.TTS(voice="25d2c432-139c-4035-bfd6-9baaabcdd006"),
        vad=ctx.proc.userdata["vad"],
        turn_handling=TurnHandlingOptions(
            turn_detection=EnglishModel(),
            # Adaptive: "mm-hmm" / "yeah" won't stop the agent; clear new sentences will
            interruption={"mode": "adaptive"},
        ),
        # Agent starts generating LLM response as soon as turn detection fires,
        # before VAD confirms silence — cuts response latency significantly
        preemptive_generation=True,
        # Cartesia supports word-level TTS timing — transcription syncs perfectly with speech
        use_tts_aligned_transcript=True,
    )

    await session.start(
        agent=Assistant(instructions=custom_instructions),
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Track transcript via conversation_item_added — fires for both user and agent turns
    # after they are committed to the chat history (fully processed, not interim)
    transcript: list[dict] = []
    call_start_time = time.time()

    @session.on("conversation_item_added")
    def on_item_added(ev):
        item = ev.item
        role = getattr(item, "role", None)
        # Extract text content from the message
        content = getattr(item, "text_content", None) or ""
        if not content:
            # Try content list for multi-modal items
            raw = getattr(item, "content", [])
            if isinstance(raw, list):
                content = " ".join(
                    c.get("text", "") if isinstance(c, dict) else str(c)
                    for c in raw
                )
            elif isinstance(raw, str):
                content = raw
        if role and content and content.strip():
            transcript.append({
                "role": "agent" if role == "assistant" else "user",
                "text": content.strip(),
                "timestamp": time.strftime("%H:%M:%S"),
            })

    # Start recording after session starts
    await recorder.start(ctx.room, ctx.room.local_participant.identity)

    # Save audio + send transcript to backend when session closes
    @session.on("close")
    def on_session_close(*args):
        saved = recorder.stop_and_save()
        for label, fpath in saved.items():
            logger.info(f"Recording saved [{label}]: {fpath}")

        # Send transcript + call data to backend
        duration_secs = time.time() - call_start_time
        try:
            payload = json.dumps({
                "transcript": transcript,
                "durationSeconds": round(duration_secs),
                "outcome": "success",
                "summary": f"Call with {agent_name} — {len(transcript)} messages, {round(duration_secs)}s",
                "sentiment": "neutral",
            }).encode("utf-8")
            req = urllib.request.Request(
                f"http://localhost:5000/api/conversations/{ctx.room.name}/complete",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            urllib.request.urlopen(req, timeout=5)
            logger.info(f"Transcript sent to backend: {len(transcript)} messages, {round(duration_secs)}s")
        except Exception as e:
            logger.warning(f"Failed to send transcript to backend: {e}")

    # Greet immediately — agent speaks first the moment the call connects
    await session.generate_reply(
        instructions=(
            f"You are {agent_name}. The phone call just connected. "
            f"Greet the user warmly, introduce yourself, and ask how you can help. "
            f"Keep the greeting brief and friendly — 1-2 sentences max."
        )
    )


if __name__ == "__main__":
    cli.run_app(server)
