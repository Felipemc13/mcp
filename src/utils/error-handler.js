import { Logger } from './logger.js';

export class ErrorHandler {
    constructor() {
        this.logger = new Logger('ERROR-HANDLER');
        this.errorHistory = [];
        this.retryStrategies = new Map();
        this.setupDefaultStrategies();
    }

    /**
     * Configurar estratégias padrão de retry
     */
    setupDefaultStrategies() {
        // Estratégia para erros de rede
        this.retryStrategies.set('network', {
            maxRetries: 3,
            delay: 2000,
            backoffMultiplier: 2,
            shouldRetry: (error) => error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT'
        });

        // Estratégia para erros de arquivo
        this.retryStrategies.set('file', {
            maxRetries: 2,
            delay: 1000,
            backoffMultiplier: 1.5,
            shouldRetry: (error) => error.code === 'ENOENT' || error.code === 'EACCES'
        });

        // Estratégia para erros de dependência
        this.retryStrategies.set('dependency', {
            maxRetries: 3,
            delay: 5000,
            backoffMultiplier: 2,
            shouldRetry: (error) => error.message.includes('MODULE_NOT_FOUND')
        });
    }

    /**
     * Manipular erro com estratégia de retry
     */
    async handleWithRetry(asyncFn, strategyName = 'default', context = {}) {
        const strategy = this.retryStrategies.get(strategyName) || {
            maxRetries: 1,
            delay: 1000,
            backoffMultiplier: 1,
            shouldRetry: () => false
        };

        let lastError;
        let attempt = 0;

        while (attempt <= strategy.maxRetries) {
            try {
                const result = await asyncFn();
                
                // Se sucesso após retry, logar recuperação
                if (attempt > 0) {
                    this.logger.success(`Recuperado após ${attempt} tentativas`);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                attempt++;

                this.recordError(error, {
                    ...context,
                    attempt,
                    strategy: strategyName
                });

                // Se não deve tentar novamente ou excedeu tentativas
                if (!strategy.shouldRetry(error) || attempt > strategy.maxRetries) {
                    break;
                }

                // Aguardar antes da próxima tentativa
                const delay = strategy.delay * Math.pow(strategy.backoffMultiplier, attempt - 1);
                this.logger.warn(`Tentativa ${attempt} falhou, aguardando ${delay}ms...`);
                await this.sleep(delay);
            }
        }

        // Se chegou aqui, todas as tentativas falharam
        throw new Error(`Operação falhou após ${attempt} tentativas: ${lastError.message}`);
    }

    /**
     * Manipular erro crítico
     */
    async handleCriticalError(error, context = {}) {
        this.logger.error('💀 ERRO CRÍTICO DETECTADO:', error.message);
        
        const errorRecord = this.recordError(error, {
            ...context,
            critical: true,
            timestamp: new Date().toISOString()
        });

        // Tentar diagnóstico automático
        const diagnosis = await this.diagnoseError(error);
        errorRecord.diagnosis = diagnosis;

        // Verificar se há solução automática
        const autoFix = await this.attemptAutoFix(error, diagnosis);
        if (autoFix.attempted) {
            errorRecord.autoFix = autoFix;
        }

        // Notificar sobre erro crítico
        await this.notifyCriticalError(errorRecord);

        return errorRecord;
    }

    /**
     * Registrar erro no histórico
     */
    recordError(error, context = {}) {
        const errorRecord = {
            id: this.generateErrorId(),
            message: error.message,
            stack: error.stack,
            code: error.code,
            type: this.classifyError(error),
            severity: this.assessSeverity(error),
            timestamp: new Date().toISOString(),
            context: context,
            resolved: false
        };

        this.errorHistory.push(errorRecord);
        return errorRecord;
    }

    /**
     * Classificar tipo de erro
     */
    classifyError(error) {
        const message = error.message.toLowerCase();
        const code = error.code;

        if (code === 'ENOENT' || code === 'EACCES') {
            return 'FILE_SYSTEM';
        }
        
        if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
            return 'NETWORK';
        }
        
        if (message.includes('module') || message.includes('package')) {
            return 'DEPENDENCY';
        }
        
        if (message.includes('syntax') || message.includes('unexpected token')) {
            return 'SYNTAX';
        }
        
        if (message.includes('permission') || message.includes('access')) {
            return 'PERMISSION';
        }
        
        if (message.includes('memory') || message.includes('heap')) {
            return 'MEMORY';
        }

        return 'UNKNOWN';
    }

    /**
     * Avaliar severidade do erro
     */
    assessSeverity(error) {
        const message = error.message.toLowerCase();
        const code = error.code;

        // Crítico
        if (message.includes('fatal') || 
            message.includes('critical') || 
            code === 'ENOSPC' || 
            message.includes('out of memory')) {
            return 'CRITICAL';
        }

        // Alto
        if (message.includes('permission denied') ||
            code === 'EACCES' ||
            message.includes('module not found')) {
            return 'HIGH';
        }

        // Médio
        if (code === 'ENOENT' ||
            message.includes('warning') ||
            message.includes('deprecated')) {
            return 'MEDIUM';
        }

        // Baixo
        return 'LOW';
    }

    /**
     * Diagnosticar erro automaticamente
     */
    async diagnoseError(error) {
        const diagnosis = {
            type: this.classifyError(error),
            possibleCauses: [],
            suggestedSolutions: [],
            confidence: 'low'
        };

        const message = error.message.toLowerCase();
        const code = error.code;

        switch (diagnosis.type) {
            case 'FILE_SYSTEM':
                if (code === 'ENOENT') {
                    diagnosis.possibleCauses.push('Arquivo ou diretório não existe');
                    diagnosis.suggestedSolutions.push('Verificar se o caminho está correto');
                    diagnosis.suggestedSolutions.push('Criar arquivo/diretório se necessário');
                    diagnosis.confidence = 'high';
                }
                break;

            case 'DEPENDENCY':
                if (message.includes('module not found')) {
                    diagnosis.possibleCauses.push('Dependência não instalada');
                    diagnosis.suggestedSolutions.push('Executar npm install');
                    diagnosis.suggestedSolutions.push('Verificar package.json');
                    diagnosis.confidence = 'high';
                }
                break;

            case 'SYNTAX':
                diagnosis.possibleCauses.push('Erro de sintaxe no código');
                diagnosis.suggestedSolutions.push('Verificar sintaxe do arquivo');
                diagnosis.suggestedSolutions.push('Usar linter para detectar problemas');
                diagnosis.confidence = 'medium';
                break;

            case 'PERMISSION':
                diagnosis.possibleCauses.push('Falta de permissões');
                diagnosis.suggestedSolutions.push('Verificar permissões do arquivo/diretório');
                diagnosis.suggestedSolutions.push('Executar com permissões adequadas');
                diagnosis.confidence = 'high';
                break;
        }

        return diagnosis;
    }

    /**
     * Tentar correção automática
     */
    async attemptAutoFix(error, diagnosis) {
        const autoFixResult = {
            attempted: false,
            successful: false,
            actions: [],
            error: null
        };

        try {
            autoFixResult.attempted = true;

            switch (diagnosis.type) {
                case 'DEPENDENCY':
                    if (error.message.includes('module not found')) {
                        await this.fixMissingDependency(error, autoFixResult);
                    }
                    break;

                case 'FILE_SYSTEM':
                    if (error.code === 'ENOENT') {
                        await this.fixMissingFile(error, autoFixResult);
                    }
                    break;

                case 'PERMISSION':
                    await this.fixPermissionError(error, autoFixResult);
                    break;
            }

        } catch (fixError) {
            autoFixResult.error = fixError.message;
            this.logger.error('Erro durante auto-correção:', fixError.message);
        }

        return autoFixResult;
    }

    /**
     * Corrigir dependência faltante
     */
    async fixMissingDependency(error, result) {
        const moduleName = this.extractModuleName(error.message);
        if (moduleName) {
            try {
                const { execSync } = await import('child_process');
                const command = `npm install ${moduleName}`;
                
                this.logger.info(`Tentando instalar dependência: ${moduleName}`);
                execSync(command, { stdio: 'pipe' });
                
                result.actions.push(`Instalou dependência: ${moduleName}`);
                result.successful = true;
                
                this.logger.success(`Dependência ${moduleName} instalada com sucesso`);
            } catch (installError) {
                result.actions.push(`Falha ao instalar ${moduleName}: ${installError.message}`);
            }
        }
    }

    /**
     * Corrigir arquivo faltante
     */
    async fixMissingFile(error, result) {
        const filePath = this.extractFilePath(error.message);
        if (filePath) {
            try {
                const fs = await import('fs-extra');
                const path = await import('path');
                
                // Criar diretório se necessário
                await fs.ensureDir(path.dirname(filePath));
                
                // Criar arquivo vazio se for um arquivo
                if (path.extname(filePath)) {
                    await fs.writeFile(filePath, '');
                    result.actions.push(`Criou arquivo: ${filePath}`);
                } else {
                    await fs.ensureDir(filePath);
                    result.actions.push(`Criou diretório: ${filePath}`);
                }
                
                result.successful = true;
                this.logger.success(`Arquivo/diretório criado: ${filePath}`);
            } catch (createError) {
                result.actions.push(`Falha ao criar ${filePath}: ${createError.message}`);
            }
        }
    }

    /**
     * Corrigir erro de permissão
     */
    async fixPermissionError(error, result) {
        // Para erros de permissão, apenas logamos - não alteramos permissões automaticamente
        result.actions.push('Erro de permissão detectado - intervenção manual necessária');
        this.logger.warn('Erro de permissão requer intervenção manual');
    }

    /**
     * Extrair nome do módulo da mensagem de erro
     */
    extractModuleName(message) {
        const patterns = [
            /Cannot find module '([^']+)'/,
            /Module not found: Error: Can't resolve '([^']+)'/,
            /Error: Cannot find module "([^"]+)"/
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Extrair caminho do arquivo da mensagem de erro
     */
    extractFilePath(message) {
        const patterns = [
            /ENOENT: no such file or directory, open '([^']+)'/,
            /ENOENT: no such file or directory, scandir '([^']+)'/,
            /no such file or directory '([^']+)'/
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Notificar erro crítico
     */
    async notifyCriticalError(errorRecord) {
        // Por enquanto apenas log, pode ser expandido para notificações
        this.logger.error('🚨 NOTIFICAÇÃO DE ERRO CRÍTICO:', {
            id: errorRecord.id,
            type: errorRecord.type,
            severity: errorRecord.severity,
            message: errorRecord.message
        });
    }

    /**
     * Gerar ID único para erro
     */
    generateErrorId() {
        return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Função auxiliar para sleep
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obter histórico de erros
     */
    getErrorHistory() {
        return this.errorHistory;
    }

    /**
     * Obter erros por tipo
     */
    getErrorsByType(type) {
        return this.errorHistory.filter(error => error.type === type);
    }

    /**
     * Obter erros por severidade
     */
    getErrorsBySeverity(severity) {
        return this.errorHistory.filter(error => error.severity === severity);
    }

    /**
     * Obter estatísticas de erros
     */
    getErrorStats() {
        const stats = {
            total: this.errorHistory.length,
            resolved: this.errorHistory.filter(e => e.resolved).length,
            byType: {},
            bySeverity: {},
            withAutoFix: this.errorHistory.filter(e => e.autoFix?.attempted).length,
            autoFixSuccessful: this.errorHistory.filter(e => e.autoFix?.successful).length
        };

        this.errorHistory.forEach(error => {
            // Por tipo
            if (!stats.byType[error.type]) {
                stats.byType[error.type] = 0;
            }
            stats.byType[error.type]++;

            // Por severidade
            if (!stats.bySeverity[error.severity]) {
                stats.bySeverity[error.severity] = 0;
            }
            stats.bySeverity[error.severity]++;
        });

        return stats;
    }

    /**
     * Marcar erro como resolvido
     */
    markErrorAsResolved(errorId) {
        const error = this.errorHistory.find(e => e.id === errorId);
        if (error) {
            error.resolved = true;
            error.resolvedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    /**
     * Limpar histórico de erros
     */
    clearErrorHistory() {
        this.errorHistory = [];
    }

    /**
     * Exportar relatório de erros
     */
    generateErrorReport() {
        const stats = this.getErrorStats();
        
        return {
            summary: stats,
            recentErrors: this.errorHistory.slice(-10),
            criticalErrors: this.getErrorsBySeverity('CRITICAL'),
            unresolvedErrors: this.errorHistory.filter(e => !e.resolved),
            timestamp: new Date().toISOString()
        };
    }
}
