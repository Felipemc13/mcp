#!/usr/bin/env node

/**
 * MCP Orquestrador - Sistema Raiz
 * 
 * Sistema automatizado que:
 * 1. Lê todo o codebase
 * 2. Entende o contexto
 * 3. Divide tarefas em etapas
 * 4. Executa com controle rigoroso
 * 5. Testa cada etapa
 * 6. Documenta automaticamente
 * 7. Valida antes de prosseguir
 */

import { Command } from 'commander';
import { startMCPOrchestrator } from './src/orchestrator.js';
import { Logger } from './src/utils/logger.js';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();
const logger = new Logger('MAIN');

// Configurar CLI
program
    .name('mcp-orchestrator')
    .description('Sistema MCP com orquestração automática e controle rigoroso')
    .version('1.0.0');

// Comando principal
program
    .command('start')
    .description('Iniciar o sistema MCP Orquestrador')
    .option('-w, --workspace <path>', 'Diretório de trabalho')
    .option('-v, --verbose', 'Output verboso')
    .option('-d, --debug', 'Modo debug')
    .action(async (options) => {
        try {
            console.log(chalk.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                    MCP ORQUESTRADOR v1.0                     ║
║                                                              ║
║  🎯 Sistema Raiz de Automação com Controle Rigoroso         ║
║  🔍 Lê codebase → 🎼 Orquestra → ⚙️ Executa → 🧪 Testa     ║
║  📚 Documenta → ✅ Valida → 🔄 Loop até completar           ║
╚══════════════════════════════════════════════════════════════╝
            `));

            // Configurar ambiente
            if (options.verbose) {
                process.env.LOG_LEVEL = 'debug';
            }
            
            if (options.debug) {
                process.env.DEBUG_MODE = 'true';
                process.env.DEBUG_VERBOSE_OUTPUT = 'true';
            }

            // Determinar workspace
            const workspaceRoot = options.workspace || process.cwd();
            
            if (!await fs.pathExists(workspaceRoot)) {
                throw new Error(`Workspace não encontrado: ${workspaceRoot}`);
            }

            logger.info(`Iniciando MCP Orquestrador...`);
            logger.info(`Workspace: ${workspaceRoot}`);
            
            // Iniciar sistema
            await startMCPOrchestrator(workspaceRoot);
            
        } catch (error) {
            logger.error('Erro ao iniciar sistema:', error.message);
            process.exit(1);
        }
    });

// Comando de análise apenas
program
    .command('analyze')
    .description('Apenas analisar o codebase sem executar tarefas')
    .option('-w, --workspace <path>', 'Diretório de trabalho')
    .option('-o, --output <file>', 'Arquivo de saída para análise')
    .action(async (options) => {
        try {
            const { MCPOrchestrator } = await import('./src/orchestrator.js');
            const orchestrator = new MCPOrchestrator(options.workspace);
            
            logger.info('Executando análise do codebase...');
            const analysis = await orchestrator.analyzeCodebase();
            
            if (options.output) {
                await fs.writeJson(options.output, analysis, { spaces: 2 });
                logger.success(`Análise salva em: ${options.output}`);
            } else {
                console.log(chalk.cyan('\n📊 ANÁLISE DO CODEBASE:'));
                console.log(analysis.context);
            }
            
        } catch (error) {
            logger.error('Erro durante análise:', error.message);
            process.exit(1);
        }
    });

// Comando de validação
program
    .command('validate')
    .description('Validar integridade do sistema')
    .action(async () => {
        try {
            logger.info('Validando integridade do sistema...');
            
            // Verificar arquivos essenciais
            const essentialFiles = [
                'src/orchestrator.js',
                'src/mcp-1-analysis.js',
                'src/mcp-2-tester.js',
                'src/mcp-3-documentor.js',
                'src/mcp-4-validator.js',
                'src/utils/logger.js',
                'src/utils/file-manager.js',
                'src/utils/error-handler.js'
            ];

            let allValid = true;
            
            for (const file of essentialFiles) {
                if (await fs.pathExists(file)) {
                    logger.success(`✅ ${file}`);
                } else {
                    logger.error(`❌ ${file} - AUSENTE`);
                    allValid = false;
                }
            }

            // Verificar dependências
            const packageJson = await fs.readJson('package.json');
            const dependencies = Object.keys(packageJson.dependencies || {});
            
            logger.info(`📦 Dependências: ${dependencies.join(', ')}`);
            
            if (allValid) {
                logger.success('🎉 Sistema validado com sucesso!');
            } else {
                logger.error('💀 Sistema com problemas de integridade');
                process.exit(1);
            }
            
        } catch (error) {
            logger.error('Erro durante validação:', error.message);
            process.exit(1);
        }
    });

// Comando de setup inicial
program
    .command('setup')
    .description('Configurar ambiente inicial')
    .action(async () => {
        try {
            logger.info('Configurando ambiente inicial...');
            
            // Criar diretórios necessários
            const dirs = ['docs', 'logs', 'backups', 'temp'];
            
            for (const dir of dirs) {
                await fs.ensureDir(dir);
                logger.success(`📁 Diretório criado: ${dir}`);
            }
            
            // Copiar .env.example para .env se não existir
            if (!await fs.pathExists('.env')) {
                await fs.copy('.env.example', '.env');
                logger.success('📄 Arquivo .env criado');
            }
            
            // Criar README se não existir
            if (!await fs.pathExists('README.md')) {
                const readmeContent = await fs.readFile('./README.md', 'utf8');
                logger.success('📖 README.md verificado');
            }
            
            logger.success('🎉 Setup concluído!');
            logger.info('Execute "npm start" para iniciar o sistema');
            
        } catch (error) {
            logger.error('Erro durante setup:', error.message);
            process.exit(1);
        }
    });

// Comando de limpeza
program
    .command('clean')
    .description('Limpar arquivos temporários e logs')
    .option('-f, --force', 'Forçar limpeza sem confirmação')
    .action(async (options) => {
        try {
            if (!options.force) {
                const inquirer = await import('inquirer');
                const answer = await inquirer.default.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: 'Tem certeza que deseja limpar todos os arquivos temporários?',
                        default: false
                    }
                ]);
                
                if (!answer.confirm) {
                    logger.info('Operação cancelada');
                    return;
                }
            }
            
            const dirsToClean = ['logs', 'temp', 'docs/output'];
            
            for (const dir of dirsToClean) {
                if (await fs.pathExists(dir)) {
                    await fs.remove(dir);
                    await fs.ensureDir(dir);
                    logger.success(`🧹 Limpeza: ${dir}`);
                }
            }
            
            logger.success('🎉 Limpeza concluída!');
            
        } catch (error) {
            logger.error('Erro durante limpeza:', error.message);
            process.exit(1);
        }
    });

// Comando de status
program
    .command('status')
    .description('Mostrar status do sistema')
    .action(async () => {
        try {
            logger.info('Verificando status do sistema...');
            
            const stats = {
                nodeVersion: process.version,
                platform: process.platform,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                workspace: process.cwd()
            };
            
            console.log(chalk.cyan('\n📊 STATUS DO SISTEMA:'));
            console.log(`🚀 Node.js: ${stats.nodeVersion}`);
            console.log(`💻 Plataforma: ${stats.platform}`);
            console.log(`📁 Workspace: ${stats.workspace}`);
            console.log(`💾 Memória: ${Math.round(stats.memory.heapUsed / 1024 / 1024)}MB`);
            
            // Verificar arquivos de log
            if (await fs.pathExists('logs')) {
                const logFiles = await fs.readdir('logs');
                console.log(`📄 Logs: ${logFiles.length} arquivo(s)`);
            }
            
            // Verificar documentação
            if (await fs.pathExists('docs')) {
                const docFiles = await fs.readdir('docs');
                console.log(`📚 Docs: ${docFiles.length} arquivo(s)`);
            }
            
        } catch (error) {
            logger.error('Erro ao verificar status:', error.message);
            process.exit(1);
        }
    });

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    logger.error('Exceção não capturada:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promise rejeitada não tratada:', reason);
    process.exit(1);
});

// Tratamento de sinais
process.on('SIGINT', () => {
    logger.info('Recebido SIGINT, encerrando graciosamente...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Recebido SIGTERM, encerrando graciosamente...');
    process.exit(0);
});

// Executar CLI
program.parse();
