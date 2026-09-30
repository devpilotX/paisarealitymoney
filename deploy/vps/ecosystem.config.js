// PM2 process definition. Started by deploy/vps/release.sh as the paisa user.
module.exports = {
  apps: [
    {
      name: 'paisareality',
      cwd: '/opt/paisareality/current',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      env: { NODE_ENV: 'production', TZ: 'Asia/Kolkata' },
      max_memory_restart: '1200M',
      kill_timeout: 10000,
      restart_delay: 2000,
      max_restarts: 20,
      time: true,
    },
  ],
};
