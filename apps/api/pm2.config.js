module.exports = {
	apps: [
		{
			name: "melinia-api",
			script: "index.js",
			interpreter: "bun",
			cwd: "/app/melinia-api",
			instances: 1,
			exec_mode: "fork",
			env_file: "/app/melinia-api/.env",
			autorestart: true,
			watch: false,
			max_memory_restart: "1G",
			error_file: "/app/log/pm2/melinia-api-error.log",
			out_file: "/app/log/pm2/melinia-api-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
			merge_logs: true,
			min_uptime: "10s",
			max_restarts: 10,
			env: {
				PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
			}
		},
		{
			name: "melinia-worker",
			script: "worker.js",
			interpreter: "bun",
			cwd: "/app/melinia-api",
			instances: 1,
			exec_mode: "fork",
			env_file: "/app/melinia-api/.env",
			autorestart: true,
			watch: false,
			max_memory_restart: "512M",
			error_file: "/app/log/pm2/melinia-worker-error.log",
			out_file: "/app/log/pm2/melinia-worker-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
			min_uptime: "10s",
			max_restarts: 10,
			env: {
				PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
			}
		}
	]
}
