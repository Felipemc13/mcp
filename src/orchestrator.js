import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Importações dos MCPs
import { MCPAnalyzer } from './mcp-1-analysis.js';
import { MCPTester } from './mcp-2-tester.js';
import { MCPDocumentor } from './mcp-3-documentor.js';
import { MCPValidator } from './mcp-4-validator.js';

// Utils
import { Logger } from './utils/logger.js';
import { FileManager } from './utils/file-manager.js';
import { ErrorHandler } from './utils/error-handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MCPOrchestrator {
    constructor(workspaceRoot = null) {
        this.logger = new Logger('ORCHESTRATOR');
        this.fileManager = new FileManager();
        this.errorHandler = new ErrorHandler();
        
        // Definir workspace root (onde vai trabalhar)
        this.workspaceRoot = workspaceRoot || process.cwd();
        
        // Inicializar MCPs
        this.analyzer = new MCPAnalyzer();
        this.tester = new MCPTester();
        this.documentor = new MCPDocumentor();
        this.validator = new MCPValidator();
        
        this.currentTask = null;
        this.taskSteps = [];
        this.currentStepIndex = 0;
        this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
        
        // Análise do codebase
        this.codebaseAnalysis = {
            structure: {},
            languages: [],
            frameworks: [],
            dependencies: {},
            files: [],
            context: ''
        };
        
        this.logger.info('🚀 MCP Orquestrador iniciado');
        this.logger.info(`📁 Workspace: ${this.workspaceRoot}`);
    }

    /**
     * ETAPA 0: Análise completa do codebase
     * Lê e entende todo o contexto antes de qualquer coisa
     */
    async analyzeCodebase() {
        this.logger.info('🔍 ETAPA 0: Analisando codebase completo...');
        
        try {
            // 1. Escanear estrutura de arquivos
            await this.scanFileStructure();
            
            // 2. Detectar linguagens e frameworks
            await this.detectTechnologies();
            
            // 3. Analisar dependências
            await this.analyzeDependencies();
            
            // 4. Ler arquivos principais para contexto
            await this.readMainFiles();
            
            // 5. Criar contexto consolidado
            this.createContextSummary();
            
            this.logger.success('✅ Análise do codebase concluída');
            this.logger.info(`📊 Encontrados: ${this.codebaseAnalysis.files.length} arquivos`);
            this.logger.info(`🔧 Linguagens: ${this.codebaseAnalysis.languages.join(', ')}`);
            this.logger.info(`📦 Frameworks: ${this.codebaseAnalysis.frameworks.join(', ')}`);
            
            return this.codebaseAnalysis;
            
        } catch (error) {
            this.logger.error('❌ Erro na análise do codebase:', error.message);
            throw error;
        }
    }

    /**
     * Escaneia toda a estrutura de arquivos do workspace
     */
    async scanFileStructure() {
        const patterns = [
            '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
            '**/*.py', '**/*.java', '**/*.cs', '**/*.php',
            '**/*.html', '**/*.css', '**/*.scss', '**/*.sass',
            '**/*.json', '**/*.yml', '**/*.yaml', '**/*.xml',
            '**/*.md', '**/*.txt', '**/Dockerfile', '**/.*rc',
            '**/package.json', '**/requirements.txt', '**/composer.json',
            '**/pom.xml', '**/build.gradle', '**/Cargo.toml'
        ];

        const ignorePatterns = [
            '**/node_modules/**', '**/dist/**', '**/build/**',
            '**/.git/**', '**/coverage/**', '**/logs/**',
            '**/tmp/**', '**/temp/**', '**/*.log'
        ];

        this.logger.info('📂 Escaneando estrutura de arquivos...');
        
        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, {
                    cwd: this.workspaceRoot,
                    ignore: ignorePatterns,
                    absolute: true
                });
                
                this.codebaseAnalysis.files.push(...files);
            } catch (error) {
                // Continuar mesmo se um padrão falhar
                this.logger.warn(`⚠️ Erro ao buscar padrão ${pattern}: ${error.message}`);
            }
        }

        // Remover duplicatas e ordenar
        this.codebaseAnalysis.files = [...new Set(this.codebaseAnalysis.files)].sort();
        
        // Criar estrutura hierárquica
        this.codebaseAnalysis.structure = this.buildFileTree();
    }

    /**
     * Detecta linguagens e frameworks usados no projeto
     */
    async detectTechnologies() {
        this.logger.info('🔧 Detectando tecnologias...');
        
        const extensions = new Set();
        const frameworks = new Set();
        
        // Analisar extensões de arquivos
        this.codebaseAnalysis.files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            if (ext) extensions.add(ext.slice(1));
        });

        // Mapear extensões para linguagens
        const languageMap = {
            'js': 'JavaScript',
            'ts': 'TypeScript', 
            'jsx': 'React/JSX',
            'tsx': 'React/TypeScript',
            'py': 'Python',
            'java': 'Java',
            'cs': 'C#',
            'php': 'PHP',
            'rb': 'Ruby',
            'go': 'Go',
            'rs': 'Rust',
            'cpp': 'C++',
            'c': 'C',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'sass': 'Sass'
        };

        extensions.forEach(ext => {
            if (languageMap[ext]) {
                this.codebaseAnalysis.languages.push(languageMap[ext]);
            }
        });

        // Detectar frameworks através de arquivos específicos
        const frameworkDetectors = [
            { file: 'package.json', framework: 'Node.js' },
            { file: 'requirements.txt', framework: 'Python' },
            { file: 'composer.json', framework: 'PHP' },
            { file: 'pom.xml', framework: 'Maven/Java' },
            { file: 'build.gradle', framework: 'Gradle/Java' },
            { file: 'Cargo.toml', framework: 'Rust' },
            { file: 'Dockerfile', framework: 'Docker' }
        ];

        for (const detector of frameworkDetectors) {
            const exists = this.codebaseAnalysis.files.some(file => 
                path.basename(file) === detector.file
            );
            if (exists) frameworks.add(detector.framework);
        }

        this.codebaseAnalysis.frameworks = Array.from(frameworks);
    }

    /**
     * Analisa dependências dos projetos
     */
    async analyzeDependencies() {
        this.logger.info('📦 Analisando dependências...');
        
        // Analisar package.json
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            try {
                const packageJson = await fs.readJson(packageJsonPath);
                this.codebaseAnalysis.dependencies.npm = {
                    dependencies: packageJson.dependencies || {},
                    devDependencies: packageJson.devDependencies || {},
                    scripts: packageJson.scripts || {}
                };
            } catch (error) {
                this.logger.warn('⚠️ Erro ao ler package.json:', error.message);
            }
        }

        // Analisar requirements.txt
        const requirementsPath = path.join(this.workspaceRoot, 'requirements.txt');
        if (await fs.pathExists(requirementsPath)) {
            try {
                const content = await fs.readFile(requirementsPath, 'utf8');
                this.codebaseAnalysis.dependencies.pip = content.split('\n')
                    .filter(line => line.trim() && !line.startsWith('#'))
                    .map(line => line.trim());
            } catch (error) {
                this.logger.warn('⚠️ Erro ao ler requirements.txt:', error.message);
            }
        }

        // Analisar composer.json
        const composerPath = path.join(this.workspaceRoot, 'composer.json');
        if (await fs.pathExists(composerPath)) {
            try {
                const composer = await fs.readJson(composerPath);
                this.codebaseAnalysis.dependencies.composer = {
                    require: composer.require || {},
                    'require-dev': composer['require-dev'] || {}
                };
            } catch (error) {
                this.logger.warn('⚠️ Erro ao ler composer.json:', error.message);
            }
        }
    }

    /**
     * Lê arquivos principais para entender o contexto
     */
    async readMainFiles() {
        this.logger.info('📖 Lendo arquivos principais...');
        
        const importantFiles = [
            'README.md', 'README.txt', 'readme.md',
            'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts',
            'main.py', '__init__.py', 'index.php', 'index.html',
            '.env.example', '.env.template', 'config.js', 'config.json'
        ];

        this.codebaseAnalysis.mainFiles = {};

        for (const fileName of importantFiles) {
            const filePath = path.join(this.workspaceRoot, fileName);
            if (await fs.pathExists(filePath)) {
                try {
                    const stats = await fs.stat(filePath);
                    // Só ler arquivos menores que 50KB para evitar sobrecarga
                    if (stats.size < 50000) {
                        const content = await fs.readFile(filePath, 'utf8');
                        this.codebaseAnalysis.mainFiles[fileName] = {
                            path: filePath,
                            content: content.substring(0, 2000), // Primeiros 2000 chars
                            size: stats.size
                        };
                    }
                } catch (error) {
                    this.logger.warn(`⚠️ Erro ao ler ${fileName}: ${error.message}`);
                }
            }
        }
    }

    /**
     * Cria um resumo consolidado do contexto
     */
    createContextSummary() {
        this.logger.info('📋 Criando resumo do contexto...');
        
        const summary = {
            projectType: this.detectProjectType(),
            primaryLanguage: this.codebaseAnalysis.languages[0] || 'Desconhecido',
            complexity: this.calculateComplexity(),
            structure: this.describeStructure(),
            capabilities: this.detectCapabilities()
        };

        this.codebaseAnalysis.context = `
ANÁLISE DO PROJETO:
===================

📁 Tipo de Projeto: ${summary.projectType}
🔧 Linguagem Principal: ${summary.primaryLanguage}
📊 Complexidade: ${summary.complexity}
🏗️ Estrutura: ${summary.structure}
⚡ Capacidades: ${summary.capabilities.join(', ')}

LINGUAGENS DETECTADAS: ${this.codebaseAnalysis.languages.join(', ')}
FRAMEWORKS/TECNOLOGIAS: ${this.codebaseAnalysis.frameworks.join(', ')}
TOTAL DE ARQUIVOS: ${this.codebaseAnalysis.files.length}

DEPENDÊNCIAS:
${Object.keys(this.codebaseAnalysis.dependencies).map(type => 
    `- ${type.toUpperCase()}: ${Object.keys(this.codebaseAnalysis.dependencies[type] || {}).length} pacotes`
).join('\n')}
        `.trim();
    }

    /**
     * FLUXO 1: Ponto de entrada principal
     * PRIMEIRO: Lê codebase, DEPOIS recebe tarefa e orquestra
     */
    async start() {
        try {
            this.logger.info('='.repeat(60));
            this.logger.info('🎯 SISTEMA MCP ORQUESTRADOR INICIADO');
            this.logger.info('='.repeat(60));

            // ETAPA 0: ANÁLISE COMPLETA DO CODEBASE (OBRIGATÓRIA)
            await this.analyzeCodebase();

            // Solicitar tarefa do usuário COM CONTEXTO
            const task = await this.requestTaskFromUser();
            
            // ETAPA 1: ORQUESTRAÇÃO - Dividir em etapas baseado no contexto
            await this.orchestrateTask(task);
            
            // ETAPA 2: EXECUÇÃO EM LOOP (até completar)
            await this.executeTaskLoop();
            
            this.logger.success('🎉 TAREFA CONCLUÍDA COM SUCESSO!');
            
        } catch (error) {
            await this.errorHandler.handleCriticalError(error, 'ORCHESTRATOR_START');
            throw error;
        }
    }

    /**
     * Solicita tarefa do usuário com contexto do codebase
     */
    async requestTaskFromUser() {
        this.logger.info('\n📝 INFORMAÇÕES DO PROJETO:');
        console.log(chalk.cyan(this.codebaseAnalysis.context));
        
        const questions = [
            {
                type: 'input',
                name: 'description',
                message: '💭 Descreva a tarefa que deseja executar (linguagem simples):',
                validate: input => input.trim().length > 10 || 'Por favor, descreva a tarefa com mais detalhes'
            },
            {
                type: 'list',
                name: 'priority',
                message: '⚡ Qual a prioridade da tarefa?',
                choices: ['Alta', 'Média', 'Baixa'],
                default: 'Média'
            },
            {
                type: 'confirm',
                name: 'autoFix',
                message: '🔧 Aplicar correções automáticas quando possível?',
                default: true
            }
        ];

        const answers = await inquirer.prompt(questions);
        
        this.currentTask = {
            id: `task_${Date.now()}`,
            description: answers.description,
            priority: answers.priority,
            autoFix: answers.autoFix,
            createdAt: new Date().toISOString(),
            codebaseContext: this.codebaseAnalysis,
            status: 'pending'
        };

        this.logger.info(`\n✅ Tarefa registrada: ${this.currentTask.id}`);
        return this.currentTask;
    }

    /**
     * ORQUESTRAÇÃO: Analisa a tarefa e divide em etapas executáveis
     */
    async orchestrateTask(task) {
        this.logger.info('\n🎼 ORQUESTRANDO TAREFA...');
        this.logger.info(`📋 Tarefa: ${task.description}`);
        
        try {
            // Analisar a tarefa no contexto do codebase
            const analysis = await this.analyzeTaskInContext(task);
            
            // Dividir em etapas específicas
            this.taskSteps = await this.createTaskSteps(analysis);
            
            // Validar etapas criadas
            await this.validateTaskSteps();
            
            this.logger.success(`✅ Tarefa dividida em ${this.taskSteps.length} etapas`);
            this.taskSteps.forEach((step, index) => {
                this.logger.info(`   ${index + 1}. ${step.title}`);
            });
            
        } catch (error) {
            this.logger.error('❌ Erro na orquestração:', error.message);
            throw error;
        }
    }

    /**
     * Analisa a tarefa no contexto específico do codebase
     */
    async analyzeTaskInContext(task) {
        this.logger.info('🔍 Analisando tarefa no contexto do projeto...');
        
        const context = this.codebaseAnalysis;
        const analysis = {
            taskType: this.identifyTaskType(task.description),
            affectedFiles: [],
            requiredSkills: [],
            estimatedComplexity: 'medium',
            suggestedApproach: '',
            prerequisites: [],
            risks: []
        };

        // Identificar tipo de tarefa
        const taskKeywords = task.description.toLowerCase();
        
        if (taskKeywords.includes('criar') || taskKeywords.includes('adicionar') || taskKeywords.includes('implementar')) {
            analysis.taskType = 'creation';
        } else if (taskKeywords.includes('corrigir') || taskKeywords.includes('bug') || taskKeywords.includes('erro')) {
            analysis.taskType = 'bugfix';
        } else if (taskKeywords.includes('melhorar') || taskKeywords.includes('otimizar') || taskKeywords.includes('refatorar')) {
            analysis.taskType = 'improvement';
        } else if (taskKeywords.includes('testar') || taskKeywords.includes('teste')) {
            analysis.taskType = 'testing';
        } else if (taskKeywords.includes('documentar') || taskKeywords.includes('documentação')) {
            analysis.taskType = 'documentation';
        } else {
            analysis.taskType = 'general';
        }

        // Determinar linguagens e ferramentas necessárias
        analysis.requiredSkills = [...context.languages];
        if (context.frameworks.length > 0) {
            analysis.requiredSkills.push(...context.frameworks);
        }

        // Sugerir abordagem baseada no tipo de projeto
        analysis.suggestedApproach = this.suggestApproach(analysis.taskType, context);
        
        return analysis;
    }

    /**
     * Cria etapas específicas baseadas na análise
     */
    async createTaskSteps(analysis) {
        this.logger.info('📝 Criando etapas específicas...');
        
        const steps = [];
        const language = this.codebaseAnalysis.languages[0] || 'JavaScript';
        
        // Etapas base sempre necessárias
        steps.push({
            id: 1,
            title: 'Análise e Preparação',
            description: `Analisar requisitos e preparar ambiente para ${analysis.taskType}`,
            type: 'analysis',
            language: language,
            estimatedTime: '5-10 min',
            requirements: analysis.prerequisites,
            deliverables: ['Plano de execução', 'Arquivos identificados'],
            status: 'pending'
        });

        // Etapas específicas por tipo de tarefa
        switch (analysis.taskType) {
            case 'creation':
                steps.push(...this.createCreationSteps(language));
                break;
            case 'bugfix':
                steps.push(...this.createBugfixSteps(language));
                break;
            case 'improvement':
                steps.push(...this.createImprovementSteps(language));
                break;
            case 'testing':
                steps.push(...this.createTestingSteps(language));
                break;
            case 'documentation':
                steps.push(...this.createDocumentationSteps(language));
                break;
            default:
                steps.push(...this.createGeneralSteps(language));
        }

        // Etapa final sempre necessária
        steps.push({
            id: steps.length + 1,
            title: 'Validação e Finalização',
            description: 'Validar resultado final e documentar mudanças',
            type: 'validation',
            language: language,
            estimatedTime: '5-10 min',
            requirements: ['Todos os testes passando'],
            deliverables: ['Documentação atualizada', 'Testes validados'],
            status: 'pending'
        });

        return steps;
    }

    /**
     * FLUXO 2: Loop de execução das etapas
     */
    async executeTaskLoop() {
        this.logger.info('\n🔄 INICIANDO LOOP DE EXECUÇÃO...');
        
        while (this.currentStepIndex < this.taskSteps.length) {
            const currentStep = this.taskSteps[this.currentStepIndex];
            
            this.logger.info(`\n📍 ETAPA ${currentStep.id}/${this.taskSteps.length}: ${currentStep.title}`);
            this.logger.info(`⏱️ Tempo estimado: ${currentStep.estimatedTime}`);
            
            let retryCount = 0;
            let stepCompleted = false;
            
            while (!stepCompleted && retryCount < this.maxRetries) {
                try {
                    // 1. EXECUTAR (MCP-1: Analisador)
                    this.logger.info('\n🔧 1. EXECUTANDO...');
                    const executionResult = await this.analyzer.execute(currentStep, this.codebaseAnalysis);
                    
                    // 2. TESTAR (MCP-2: Testador)
                    this.logger.info('\n🧪 2. TESTANDO...');
                    const testResult = await this.tester.test(currentStep, executionResult);
                    
                    if (testResult.hasErrors) {
                        // Se há erros, diagnosticar e tentar corrigir
                        this.logger.warn('⚠️ ERROS ENCONTRADOS - Iniciando diagnóstico...');
                        const diagnostic = await this.tester.diagnose(testResult.errors);
                        
                        if (this.currentTask.autoFix && diagnostic.canAutoFix) {
                            this.logger.info('🔄 Aplicando correção automática...');
                            await this.analyzer.applyFix(diagnostic.suggestedFix);
                            retryCount++;
                            continue; // Volta para executar novamente
                        } else {
                            // Erro que não pode ser corrigido automaticamente
                            throw new Error(`Erros que impedem a conclusão: ${diagnostic.errors.join(', ')}`);
                        }
                    }
                    
                    // 3. DOCUMENTAR (MCP-3: Documentador)
                    this.logger.info('\n📚 3. DOCUMENTANDO...');
                    await this.documentor.document(currentStep, executionResult, testResult);
                    
                    // 4. VALIDAR (MCP-4: Validador)
                    this.logger.info('\n✅ 4. VALIDANDO...');
                    const validationResult = await this.validator.validate(currentStep, executionResult, testResult);
                    
                    if (validationResult.approved) {
                        stepCompleted = true;
                        currentStep.status = 'completed';
                        currentStep.completedAt = new Date().toISOString();
                        
                        this.logger.success(`✅ ETAPA ${currentStep.id} CONCLUÍDA COM SUCESSO!`);
                        
                        // Verificar se há próxima etapa
                        if (this.currentStepIndex + 1 < this.taskSteps.length) {
                            this.logger.info('➡️ Passando para próxima etapa...');
                            this.currentStepIndex++;
                        } else {
                            this.logger.success('🎉 TODAS AS ETAPAS CONCLUÍDAS!');
                            break;
                        }
                    } else {
                        throw new Error(`Validação falhou: ${validationResult.reasons.join(', ')}`);
                    }
                    
                } catch (error) {
                    retryCount++;
                    this.logger.error(`❌ Erro na tentativa ${retryCount}:`, error.message);
                    
                    if (retryCount >= this.maxRetries) {
                        this.logger.error(`💀 ETAPA ${currentStep.id} FALHOU após ${this.maxRetries} tentativas`);
                        throw new Error(`Não foi possível completar a etapa: ${error.message}`);
                    } else {
                        this.logger.warn(`🔄 Tentando novamente (${retryCount}/${this.maxRetries})...`);
                        await this.sleep(2000); // Aguardar 2 segundos antes de tentar novamente
                    }
                }
            }
        }
    }

    // ===== FUNÇÕES AUXILIARES =====

    buildFileTree() {
        const tree = {};
        this.codebaseAnalysis.files.forEach(file => {
            const relativePath = path.relative(this.workspaceRoot, file);
            const parts = relativePath.split(path.sep);
            let current = tree;
            
            parts.forEach((part, index) => {
                if (index === parts.length - 1) {
                    current[part] = 'file';
                } else {
                    current[part] = current[part] || {};
                    current = current[part];
                }
            });
        });
        return tree;
    }

    detectProjectType() {
        if (this.codebaseAnalysis.dependencies.npm) return 'Node.js Project';
        if (this.codebaseAnalysis.dependencies.pip) return 'Python Project';
        if (this.codebaseAnalysis.dependencies.composer) return 'PHP Project';
        if (this.codebaseAnalysis.languages.includes('Java')) return 'Java Project';
        if (this.codebaseAnalysis.languages.includes('C#')) return '.NET Project';
        return 'Multi-language Project';
    }

    calculateComplexity() {
        const fileCount = this.codebaseAnalysis.files.length;
        const langCount = this.codebaseAnalysis.languages.length;
        
        if (fileCount < 10 && langCount <= 2) return 'Baixa';
        if (fileCount < 50 && langCount <= 3) return 'Média';
        return 'Alta';
    }

    describeStructure() {
        const hasTests = this.codebaseAnalysis.files.some(f => 
            f.includes('test') || f.includes('spec') || f.includes('__test__')
        );
        const hasDocs = this.codebaseAnalysis.files.some(f => 
            f.includes('README') || f.includes('docs')
        );
        
        return `${hasTests ? 'Com testes' : 'Sem testes'}, ${hasDocs ? 'Documentado' : 'Sem documentação'}`;
    }

    detectCapabilities() {
        const capabilities = [];
        
        if (this.codebaseAnalysis.dependencies.npm) {
            const deps = Object.keys(this.codebaseAnalysis.dependencies.npm.dependencies || {});
            if (deps.includes('express')) capabilities.push('API Server');
            if (deps.includes('react')) capabilities.push('React App');
            if (deps.includes('next')) capabilities.push('Next.js App');
            if (deps.includes('jest')) capabilities.push('Testing');
        }
        
        if (capabilities.length === 0) capabilities.push('Código customizado');
        return capabilities;
    }

    suggestApproach(taskType, context) {
        const approaches = {
            creation: `Criar novos arquivos seguindo padrões do projeto ${context.languages[0]}`,
            bugfix: `Identificar causa raiz e aplicar correção mínima necessária`,
            improvement: `Refatorar código mantendo funcionalidade existente`,
            testing: `Implementar testes cobrindo cenários principais`,
            documentation: `Documentar seguindo padrões do projeto`,
            general: `Analisar requisitos e implementar solução apropriada`
        };
        
        return approaches[taskType] || approaches.general;
    }

    createCreationSteps(language) {
        return [
            {
                id: 2,
                title: 'Implementação',
                description: `Criar/implementar funcionalidade em ${language}`,
                type: 'implementation',
                language: language,
                estimatedTime: '15-30 min',
                requirements: ['Plano aprovado'],
                deliverables: ['Código implementado'],
                status: 'pending'
            }
        ];
    }

    createBugfixSteps(language) {
        return [
            {
                id: 2,
                title: 'Reprodução do Bug',
                description: 'Reproduzir e identificar causa raiz',
                type: 'investigation',
                language: language,
                estimatedTime: '10-20 min',
                requirements: ['Descrição do problema'],
                deliverables: ['Causa raiz identificada'],
                status: 'pending'
            },
            {
                id: 3,
                title: 'Correção',
                description: 'Aplicar correção mínima necessária',
                type: 'fix',
                language: language,
                estimatedTime: '5-15 min',
                requirements: ['Causa raiz conhecida'],
                deliverables: ['Bug corrigido'],
                status: 'pending'
            }
        ];
    }

    createImprovementSteps(language) {
        return [
            {
                id: 2,
                title: 'Refatoração',
                description: `Melhorar código mantendo funcionalidade`,
                type: 'refactor',
                language: language,
                estimatedTime: '20-40 min',
                requirements: ['Testes existentes'],
                deliverables: ['Código melhorado'],
                status: 'pending'
            }
        ];
    }

    createTestingSteps(language) {
        return [
            {
                id: 2,
                title: 'Implementação de Testes',
                description: `Criar testes em ${language}`,
                type: 'testing',
                language: language,
                estimatedTime: '15-30 min',
                requirements: ['Código a ser testado'],
                deliverables: ['Testes implementados'],
                status: 'pending'
            }
        ];
    }

    createDocumentationSteps(language) {
        return [
            {
                id: 2,
                title: 'Escrita de Documentação',
                description: 'Criar/atualizar documentação',
                type: 'documentation',
                language: 'Markdown',
                estimatedTime: '10-20 min',
                requirements: ['Funcionalidade implementada'],
                deliverables: ['Documentação atualizada'],
                status: 'pending'
            }
        ];
    }

    createGeneralSteps(language) {
        return [
            {
                id: 2,
                title: 'Implementação Geral',
                description: `Executar tarefa solicitada`,
                type: 'general',
                language: language,
                estimatedTime: '15-30 min',
                requirements: ['Requisitos definidos'],
                deliverables: ['Tarefa executada'],
                status: 'pending'
            }
        ];
    }

    /**
     * Finaliza a tarefa com sucesso
     */
    async finalizateTask() {
        this.logger.info('🎉 TAREFA CONCLUÍDA COM SUCESSO!');
        this.logger.info('='.repeat(50));
        
        // Gerar relatório final
        const report = await this.generateFinalReport();
        
        // Salvar backup
        await this.createBackup();
        
        this.logger.success('✅ Relatório final gerado');
        this.logger.success('✅ Backup criado');
        this.logger.info('🎯 Todas as etapas foram executadas com rigor e aprovadas!');
    }

    /**
     * Gera relatório final da execução
     */
    async generateFinalReport() {
        const report = {
            task: this.currentTask,
            steps: this.taskSteps,
            executedAt: new Date().toISOString(),
            totalSteps: this.taskSteps.length,
            success: true
        };
        
        await this.fileManager.saveReport(report);
        return report;
    }

    /**
     * Cria backup do projeto
     */
    async createBackup() {
        if (process.env.AUTO_BACKUP === 'true') {
            await this.fileManager.createBackup(this.currentTask.projectPath);
        }
    }

    /**
     * Utilitário para delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const orchestrator = new MCPOrchestrator();
    orchestrator.start().catch(error => {
        console.error(chalk.red('❌ Erro fatal no orquestrador:'), error);
        process.exit(1);
    });
}

// Função principal para iniciar o sistema
export async function startMCPOrchestrator(workspaceRoot = null) {
    try {
        const orchestrator = new MCPOrchestrator(workspaceRoot);
        await orchestrator.start();
    } catch (error) {
        console.error(chalk.red('💀 ERRO CRÍTICO:'), error.message);
        process.exit(1);
    }
}
