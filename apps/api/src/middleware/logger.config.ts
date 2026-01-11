import { spawn } from "child_process"

const LOG_PATH = "/app/logs"
const ARCHIVE_PATH = `${LOG_PATH}/archived`

export const setupLogRotation = (): void => {
    const rotateLogs = (): void => {
        const today = new Date().toISOString().split("T")[0]

        spawn("sh", [
            "-c",
            `
      # Create logs directory if not exists
      mkdir -p ${LOG_PATH} ${ARCHIVE_PATH}
      
      # Archive current day's logs if they exist
      if [ -f ${LOG_PATH}/app.log ]; then
        cp ${LOG_PATH}/app.log ${ARCHIVE_PATH}/app-${today}.log
        > ${LOG_PATH}/app.log
      fi
      
      # Delete logs older than 7 days
      find ${ARCHIVE_PATH} -name "app-*.log" -mtime +7 -delete
    `,
        ])
    }

    setInterval(rotateLogs, 24 * 60 * 60 * 1000)

    spawn("sh", ["-c", `mkdir -p ${LOG_PATH} ${ARCHIVE_PATH}`])
}
