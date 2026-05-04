module.exports = {
  apps: [
    {
      name: 'b2b-backend',
      cwd: '/home/ubuntu/app/backend',
      script: 'server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '/home/ubuntu/app/backend/.env',
      restart_delay: 3000,
      max_restarts: 10,
      out_file: '/home/ubuntu/logs/backend.log',
      error_file: '/home/ubuntu/logs/backend-err.log',
    },
    {
      name: 'b2b-agent',
      cwd: '/home/ubuntu/app/voiceagent-livekit',
      script: 'src/agent.py',
      interpreter: '/home/ubuntu/app/voiceagent-livekit/.venv/bin/python',
      args: 'dev',
      restart_delay: 5000,
      max_restarts: 10,
      out_file: '/home/ubuntu/logs/agent.log',
      error_file: '/home/ubuntu/logs/agent-err.log',
    },
  ],
};
