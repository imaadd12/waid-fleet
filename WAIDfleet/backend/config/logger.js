const winston = require("winston");
const path = require("path");

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports (where logs will be written)
const transports = [
  // Console transport
  new winston.transports.Console(),

  // Error logs
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/error.log"),
    level: "error",
    format: winston.format.uncolorize(),
  }),

  // All logs
  new winston.transports.File({
    filename: path.join(__dirname, "../logs/combined.log"),
    format: winston.format.uncolorize(),
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  levels,
  format,
  transports,
});

module.exports = logger;
