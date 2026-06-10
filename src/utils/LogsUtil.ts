import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

export class LogsUtil {
    private static logger: winston.Logger;
    private static readonly logsPath = path.resolve('./logs');

    public static initialize(): void {
        if (this.logger) return;

        if (!fs.existsSync(this.logsPath)) {
            fs.mkdirSync(this.logsPath, { recursive: true });
        }

        const fileLogFormat = printf(({ level, message, timestamp }) => {
            return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
        });

        const consoleLogFormat = combine(
            colorize({ all: true }),
            printf(({ level, message, timestamp }) => {
                return `[${timestamp}] ${level}: ${message}`;
            })
        );

        this.logger = winston.createLogger({
            level: 'debug',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
            ),
            transports: [
                new winston.transports.File({ 
                    filename: path.join(this.logsPath, 'error.log'), 
                    level: 'error',
                    format: fileLogFormat
                }),
                new winston.transports.File({ 
                    filename: path.join(this.logsPath, 'info.log'), 
                    level: 'info',
                    format: fileLogFormat
                }),
                new winston.transports.File({ 
                    filename: path.join(this.logsPath, 'debug.log'), 
                    level: 'debug',
                    format: fileLogFormat
                }),
                new winston.transports.File({ 
                    filename: path.join(this.logsPath, 'combined.log'),
                    format: fileLogFormat
                }),
                new winston.transports.Console({
                    format: consoleLogFormat
                })
            ]
        });
    }

    /**
     * Limpia por completo la carpeta de logs viejos al iniciar una nueva suite completa.
     */
    public static cleanLogsFolder(): void {
        if (fs.existsSync(this.logsPath)) {
            console.log('[CLEANER] Detectada carpeta "logs" previa. Limpiando trazas antiguas...');
            fs.rmSync(this.logsPath, { recursive: true, force: true });
        }
        fs.mkdirSync(this.logsPath, { recursive: true });
    }
    
    public static info(message: string): void {
        this.ensureInitialized();
        this.logger.info(message);
    }

    public static error(message: string): void {
        this.ensureInitialized();
        this.logger.error(message);
    }

    public static debug(message: string): void {
        this.ensureInitialized();
        this.logger.debug(message);
    }

    public static warn(message: string): void {
        this.ensureInitialized();
        this.logger.warn(message);
    }

    private static ensureInitialized(): void {
        if (!this.logger) {
            this.initialize();
        }
    }
}