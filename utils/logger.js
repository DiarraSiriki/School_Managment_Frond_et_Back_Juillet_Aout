import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logsDir, 'app.log');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function formatArgs(args) {
  return args
    .map((arg) => typeof arg === 'string' ? arg : JSON.stringify(arg))
    .join(' ');
}

function writeLog(level, message) {
  const line = `[${timestamp()}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, line, 'utf8');
}

const logger = {
  info(...args) {
    const message = formatArgs(args);
    writeLog('INFO', message);
  },
  warn(...args) {
    const message = formatArgs(args);
    writeLog('WARN', message);
  },
  warning(...args) {
    this.warn(...args);
  },
  error(...args) {
    const message = formatArgs(args);
    writeLog('ERROR', message);
  },
};

export function logToFile(level, message) {
  writeLog(level, message);
}

export default logger;
