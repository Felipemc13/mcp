import chalk from 'chalk';

export class Logger {
    constructor(module = 'SYSTEM') {
        this.module = module;
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logs = [];
    }

    /**
     * Log de informação
     */
    info(message, ...args) {
        this._log('INFO', message, chalk.blue, ...args);
    }

    /**
     * Log de sucesso
     */
    success(message, ...args) {
        this._log('SUCCESS', message, chalk.green, ...args);
    }

    /**
     * Log de aviso
     */
    warn(message, ...args) {
        this._log('WARN', message, chalk.yellow, ...args);
    }

    /**
     * Log de erro
     */
    error(message, ...args) {
        this._log('ERROR', message, chalk.red, ...args);
    }

    /**
     * Log de debug
     */
    debug(message, ...args) {
        if (this.logLevel === 'debug') {
            this._log('DEBUG', message, chalk.gray, ...args);
        }
    }

    /**
     * Método interno de logging
     */
    _log(level, message, colorFn, ...args) {
        const timestamp = new Date().toISOString();
        const moduleStr = `[${this.module}]`;
        const levelStr = `[${level}]`;
        
        const logEntry = {
            timestamp,
            module: this.module,
            level,
            message: typeof message === 'string' ? message : JSON.stringify(message),
            args: args.length > 0 ? args : undefined
        };

        this.logs.push(logEntry);

        // Formatação colorida para console
        const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
        const output = `${chalk.gray(timestamp)} ${colorFn(moduleStr)} ${colorFn(levelStr)} ${formattedMessage}`;
        
        console.log(output);
        
        // Log adicional dos argumentos se houver
        if (args.length > 0) {
            args.forEach(arg => {
                console.log(chalk.gray('  →'), typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg);
            });
        }
    }

    /**
     * Obtém todos os logs
     */
    getLogs() {
        return this.logs;
    }

    /**
     * Limpa os logs
     */
    clearLogs() {
        this.logs = [];
    }

    /**
     * Filtra logs por nível
     */
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Obtém estatísticas dos logs
     */
    getLogStats() {
        const stats = {
            total: this.logs.length,
            info: 0,
            success: 0,
            warn: 0,
            error: 0,
            debug: 0
        };

        this.logs.forEach(log => {
            const level = log.level.toLowerCase();
            if (stats.hasOwnProperty(level)) {
                stats[level]++;
            }
        });

        return stats;
    }

    /**
     * Salva logs em arquivo
     */
    async saveLogsToFile(filePath) {
        const fs = await import('fs-extra');
        const content = this.logs.map(log => {
            const argsStr = log.args ? ` | Args: ${JSON.stringify(log.args)}` : '';
            return `${log.timestamp} [${log.module}] [${log.level}] ${log.message}${argsStr}`;
        }).join('\n');

        await fs.writeFile(filePath, content);
        this.info(`Logs salvos em: ${filePath}`);
    }

    /**
     * Cria um logger filho com módulo específico
     */
    createChild(childModule) {
        return new Logger(`${this.module}:${childModule}`);
    }
}
