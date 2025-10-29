module.exports = {
  apps: [{
    name: 'atlas-server',
    script: './server.js',
    cwd: '/Users/ekodevapps/Desktop/atlas-voice-extension/dev/server',
    instances: 1,
    exec_mode: 'fork', // Use fork mode instead of cluster
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 8787
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
