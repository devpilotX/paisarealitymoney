// PM2 process definition. Started by deploy/vps/release.sh as the paisa user.
module.exports = {
  apps: [
    {
      name: 'paisareality',
      cwd: '/opt/paisareality/current',
      script: 'node_modules/next/dist/bin/next',
      // 'localhost', not 127.0.0.1: with an IP here, Next treats the admin-host rewrite in
      // middleware as an external URL and tries to proxy it over TLS, which fails.
      args: 'start -p 3000 -H localhost',
      env: { NODE_ENV: 'production', TZ: 'Asia/Kolkata' },
      max_memory_restart: '1200M',
      kill_timeout: 10000,
      restart_delay: 2000,
      max_restarts: 20,
      time: true,
    },
  ],
};
