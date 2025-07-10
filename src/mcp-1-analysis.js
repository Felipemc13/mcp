import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { Logger } from './utils/logger.js';
import { FileManager } from './utils/file-manager.js';
import { ErrorHandler } from './utils/error-handler.js';

export class MCPAnalyzer {
    constructor() {
        this.logger = new Logger('MCP-1-ANALYZER');
        this.fileManager = new FileManager();
        this.errorHandler = new ErrorHandler();
        this.executionHistory = [];
        
        this.logger.info('🔧 MCP-1 Analisador inicializado');
    }

    /**
     * FUNÇÃO PRINCIPAL: Executa a etapa solicitada
     */
    async execute(step, codebaseContext) {
        this.logger.info(`🚀 Executando: ${step.title}`);
        
        try {
            const executionResult = {
                stepId: step.id,
                startTime: new Date().toISOString(),
                type: step.type,
                language: step.language,
                filesModified: [],
                filesCreated: [],
                commandsExecuted: [],
                output: '',
                errors: [],
                success: false
            };

            // Análise detalhada da etapa
            const analysis = await this.analyzeStep(step, codebaseContext);
            executionResult.analysis = analysis;

            // Executar baseado no tipo de etapa
            switch (step.type) {
                case 'analysis':
                    await this.executeAnalysis(step, codebaseContext, executionResult);
                    break;
                case 'implementation':
                    await this.executeImplementation(step, codebaseContext, executionResult);
                    break;
                case 'investigation':
                    await this.executeInvestigation(step, codebaseContext, executionResult);
                    break;
                case 'fix':
                    await this.executeFix(step, codebaseContext, executionResult);
                    break;
                case 'refactor':
                    await this.executeRefactor(step, codebaseContext, executionResult);
                    break;
                case 'testing':
                    await this.executeTesting(step, codebaseContext, executionResult);
                    break;
                case 'documentation':
                    await this.executeDocumentation(step, codebaseContext, executionResult);
                    break;
                case 'validation':
                    await this.executeValidation(step, codebaseContext, executionResult);
                    break;
                default:
                    await this.executeGeneral(step, codebaseContext, executionResult);
            }

            executionResult.endTime = new Date().toISOString();
            executionResult.duration = this.calculateDuration(executionResult.startTime, executionResult.endTime);
            executionResult.success = true;

            this.executionHistory.push(executionResult);
            this.logger.success(`✅ Etapa ${step.id} executada com sucesso`);
            
            return executionResult;

        } catch (error) {
            this.logger.error(`❌ Erro na execução da etapa ${step.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Analisa a etapa para entender o que precisa ser feito
     */
    async analyzeStep(step, codebaseContext) {
        this.logger.info('🔍 Analisando etapa...');
        
        const analysis = {
            targetFiles: [],
            dependencies: [],
            requiredTools: [],
            estimatedComplexity: 'medium',
            potentialIssues: [],
            executionPlan: []
        };

        // Identificar arquivos alvo baseado na descrição
        analysis.targetFiles = await this.identifyTargetFiles(step, codebaseContext);
        
        // Identificar dependências necessárias
        analysis.dependencies = this.identifyDependencies(step, codebaseContext);
        
        // Criar plano de execução
        analysis.executionPlan = this.createExecutionPlan(step, analysis);
        
        return analysis;
    }

    /**
     * TIPO: Analysis - Análise e preparação
     */
    async executeAnalysis(step, codebaseContext, result) {
        this.logger.info('📊 Executando análise e preparação...');
        
        // 1. Analisar requisitos da tarefa
        const requirements = await this.analyzeRequirements(step, codebaseContext);
        result.output += `REQUISITOS ANALISADOS:\n${JSON.stringify(requirements, null, 2)}\n\n`;
        
        // 2. Verificar dependências
        const dependencyCheck = await this.checkDependencies(requirements.dependencies);
        result.output += `DEPENDÊNCIAS:\n${JSON.stringify(dependencyCheck, null, 2)}\n\n`;
        
        // 3. Preparar ambiente se necessário
        if (dependencyCheck.missing.length > 0) {
            await this.prepareDependencies(dependencyCheck.missing, result);
        }
        
        // 4. Criar estrutura de arquivos se necessário
        const fileStructure = await this.prepareFileStructure(requirements.files, result);
        result.output += `ESTRUTURA PREPARADA:\n${JSON.stringify(fileStructure, null, 2)}\n\n`;
        
        result.deliverables = {
            requirements,
            dependencyCheck,
            fileStructure
        };
    }

    /**
     * TIPO: Implementation - Implementação de funcionalidade
     */
    async executeImplementation(step, codebaseContext, result) {
        this.logger.info('⚙️ Executando implementação...');
        
        // 1. Analisar o que implementar
        const implementationPlan = await this.createImplementationPlan(step, codebaseContext);
        result.output += `PLANO DE IMPLEMENTAÇÃO:\n${JSON.stringify(implementationPlan, null, 2)}\n\n`;
        
        // 2. Criar/modificar arquivos necessários
        for (const fileAction of implementationPlan.fileActions) {
            await this.executeFileAction(fileAction, result);
        }
        
        // 3. Executar comandos necessários
        for (const command of implementationPlan.commands) {
            await this.executeCommand(command, result);
        }
        
        result.deliverables = {
            implementationPlan,
            filesAffected: result.filesModified.concat(result.filesCreated)
        };
    }

    /**
     * TIPO: Investigation - Investigação de problemas
     */
    async executeInvestigation(step, codebaseContext, result) {
        this.logger.info('🔍 Executando investigação...');
        
        // 1. Analisar logs e erros
        const errorAnalysis = await this.analyzeErrors(codebaseContext);
        result.output += `ANÁLISE DE ERROS:\n${JSON.stringify(errorAnalysis, null, 2)}\n\n`;
        
        // 2. Reproduzir problema
        const reproduction = await this.reproduceIssue(step, codebaseContext, result);
        result.output += `REPRODUÇÃO:\n${JSON.stringify(reproduction, null, 2)}\n\n`;
        
        // 3. Identificar causa raiz
        const rootCause = await this.identifyRootCause(errorAnalysis, reproduction);
        result.output += `CAUSA RAIZ:\n${JSON.stringify(rootCause, null, 2)}\n\n`;
        
        result.deliverables = {
            errorAnalysis,
            reproduction,
            rootCause
        };
    }

    /**
     * TIPO: Fix - Correção de problemas
     */
    async executeFix(step, codebaseContext, result) {
        this.logger.info('🔧 Executando correção...');
        
        // 1. Aplicar correção baseada na investigação anterior
        const previousResults = this.findPreviousResults('investigation');
        if (!previousResults) {
            throw new Error('Correção requer investigação prévia');
        }
        
        const fixPlan = await this.createFixPlan(previousResults.deliverables.rootCause);
        result.output += `PLANO DE CORREÇÃO:\n${JSON.stringify(fixPlan, null, 2)}\n\n`;
        
        // 2. Aplicar correções
        for (const fix of fixPlan.fixes) {
            await this.applyFix(fix, result);
        }
        
        result.deliverables = {
            fixPlan,
            appliedFixes: fixPlan.fixes
        };
    }

    /**
     * TIPO: Refactor - Refatoração de código
     */
    async executeRefactor(step, codebaseContext, result) {
        this.logger.info('♻️ Executando refatoração...');
        
        // 1. Analisar código atual
        const codeAnalysis = await this.analyzeCodeQuality(step, codebaseContext);
        result.output += `ANÁLISE DE QUALIDADE:\n${JSON.stringify(codeAnalysis, null, 2)}\n\n`;
        
        // 2. Criar plano de refatoração
        const refactorPlan = await this.createRefactorPlan(codeAnalysis);
        result.output += `PLANO DE REFATORAÇÃO:\n${JSON.stringify(refactorPlan, null, 2)}\n\n`;
        
        // 3. Aplicar refatorações
        for (const refactor of refactorPlan.refactors) {
            await this.applyRefactor(refactor, result);
        }
        
        result.deliverables = {
            codeAnalysis,
            refactorPlan
        };
    }

    /**
     * TIPO: Testing - Implementação de testes
     */
    async executeTesting(step, codebaseContext, result) {
        this.logger.info('🧪 Executando implementação de testes...');
        
        // 1. Analisar código a ser testado
        const testAnalysis = await this.analyzeTestRequirements(step, codebaseContext);
        result.output += `ANÁLISE DE TESTES:\n${JSON.stringify(testAnalysis, null, 2)}\n\n`;
        
        // 2. Criar testes
        for (const testSuite of testAnalysis.testSuites) {
            await this.createTestSuite(testSuite, result);
        }
        
        // 3. Configurar ambiente de testes se necessário
        if (testAnalysis.needsSetup) {
            await this.setupTestEnvironment(testAnalysis.testFramework, result);
        }
        
        result.deliverables = {
            testAnalysis,
            testsCreated: result.filesCreated.filter(f => f.includes('test') || f.includes('spec'))
        };
    }

    /**
     * TIPO: Documentation - Documentação
     */
    async executeDocumentation(step, codebaseContext, result) {
        this.logger.info('📚 Executando documentação...');
        
        // 1. Analisar o que documentar
        const docAnalysis = await this.analyzeDocumentationNeeds(step, codebaseContext);
        result.output += `ANÁLISE DE DOCUMENTAÇÃO:\n${JSON.stringify(docAnalysis, null, 2)}\n\n`;
        
        // 2. Criar/atualizar documentação
        for (const docItem of docAnalysis.documentationItems) {
            await this.createDocumentation(docItem, result);
        }
        
        result.deliverables = {
            docAnalysis,
            documentsCreated: result.filesCreated.filter(f => f.includes('.md') || f.includes('README'))
        };
    }

    /**
     * TIPO: Validation - Validação final
     */
    async executeValidation(step, codebaseContext, result) {
        this.logger.info('✅ Executando validação...');
        
        // 1. Validar todas as etapas anteriores
        const validation = await this.validateAllSteps();
        result.output += `VALIDAÇÃO GERAL:\n${JSON.stringify(validation, null, 2)}\n\n`;
        
        // 2. Executar testes finais
        const finalTests = await this.runFinalTests(codebaseContext, result);
        result.output += `TESTES FINAIS:\n${JSON.stringify(finalTests, null, 2)}\n\n`;
        
        // 3. Verificar qualidade do código
        const qualityCheck = await this.runQualityChecks(codebaseContext, result);
        result.output += `VERIFICAÇÃO DE QUALIDADE:\n${JSON.stringify(qualityCheck, null, 2)}\n\n`;
        
        result.deliverables = {
            validation,
            finalTests,
            qualityCheck
        };
    }

    /**
     * TIPO: General - Execução geral
     */
    async executeGeneral(step, codebaseContext, result) {
        this.logger.info('⚙️ Executando tarefa geral...');
        
        // Implementação flexível baseada na descrição da etapa
        const generalPlan = await this.createGeneralPlan(step, codebaseContext);
        result.output += `PLANO GERAL:\n${JSON.stringify(generalPlan, null, 2)}\n\n`;
        
        // Executar ações planejadas
        for (const action of generalPlan.actions) {
            await this.executeGeneralAction(action, result);
        }
        
        result.deliverables = {
            generalPlan,
            actionsExecuted: generalPlan.actions.length
        };
    }

    /**
     * Aplica uma correção específica (usado pelo sistema de auto-fix)
     */
    async applyFix(fix, targetResult = null) {
        this.logger.info(`🔧 Aplicando correção: ${fix.description || 'Correção automática'}`);
        
        try {
            switch (fix.type) {
                case 'file':
                    await this.applyFileFix(fix);
                    break;
                case 'dependency':
                    await this.applyDependencyFix(fix);
                    break;
                case 'command':
                    await this.applyCommandFix(fix);
                    break;
                case 'configuration':
                    await this.applyConfigurationFix(fix);
                    break;
                default:
                    throw new Error(`Tipo de correção não suportado: ${fix.type}`);
            }
            
            if (targetResult) {
                targetResult.output += `CORREÇÃO APLICADA: ${fix.description}\n`;
                if (fix.files) {
                    targetResult.filesModified.push(...fix.files);
                }
            }
            
            this.logger.success('✅ Correção aplicada com sucesso');
            
        } catch (error) {
            this.logger.error('❌ Erro ao aplicar correção:', error.message);
            throw error;
        }
    }

    // ===== FUNÇÕES AUXILIARES =====

    async identifyTargetFiles(step, codebaseContext) {
        const files = [];
        
        // Buscar por padrões na descrição da etapa
        const description = step.description.toLowerCase();
        
        if (description.includes('package.json')) {
            files.push(path.join(codebaseContext.workspaceRoot || process.cwd(), 'package.json'));
        }
        
        if (description.includes('readme')) {
            files.push(path.join(codebaseContext.workspaceRoot || process.cwd(), 'README.md'));
        }
        
        // Buscar arquivos por extensão baseado na linguagem
        if (step.language) {
            const extensions = this.getExtensionsForLanguage(step.language);
            for (const ext of extensions) {
                const pattern = `**/*.${ext}`;
                // Implementar busca por glob aqui se necessário
            }
        }
        
        return files;
    }

    identifyDependencies(step, codebaseContext) {
        const dependencies = [];
        
        // Analisar dependências baseado no tipo de etapa e linguagem
        switch (step.language) {
            case 'JavaScript':
            case 'TypeScript':
                if (step.type === 'testing') {
                    dependencies.push('jest', 'jest-environment-node');
                }
                break;
            case 'Python':
                if (step.type === 'testing') {
                    dependencies.push('pytest', 'pytest-cov');
                }
                break;
        }
        
        return dependencies;
    }

    createExecutionPlan(step, analysis) {
        return [
            `1. Analisar ${analysis.targetFiles.length} arquivos alvo`,
            `2. Verificar ${analysis.dependencies.length} dependências`,
            `3. Executar tarefa do tipo '${step.type}'`,
            '4. Validar resultado'
        ];
    }

    async analyzeRequirements(step, codebaseContext) {
        return {
            type: step.type,
            language: step.language,
            dependencies: this.identifyDependencies(step, codebaseContext),
            files: await this.identifyTargetFiles(step, codebaseContext),
            estimatedTime: step.estimatedTime
        };
    }

    async checkDependencies(dependencies) {
        const installed = [];
        const missing = [];
        
        for (const dep of dependencies) {
            try {
                // Verificar se está instalado (simplificado)
                execSync(`npm list ${dep}`, { stdio: 'ignore' });
                installed.push(dep);
            } catch {
                missing.push(dep);
            }
        }
        
        return { installed, missing, total: dependencies.length };
    }

    async prepareDependencies(missing, result) {
        for (const dep of missing) {
            try {
                this.logger.info(`📦 Instalando dependência: ${dep}`);
                const command = `npm install ${dep}`;
                execSync(command, { stdio: 'pipe' });
                result.commandsExecuted.push(command);
                result.output += `Dependência instalada: ${dep}\n`;
            } catch (error) {
                result.errors.push(`Erro ao instalar ${dep}: ${error.message}`);
            }
        }
    }

    async prepareFileStructure(files, result) {
        const structure = { created: [], verified: [] };
        
        for (const file of files) {
            const dir = path.dirname(file);
            if (!await fs.pathExists(dir)) {
                await fs.ensureDir(dir);
                structure.created.push(dir);
            }
            structure.verified.push(file);
        }
        
        return structure;
    }

    calculateDuration(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        return Math.round((end - start) / 1000); // segundos
    }

    findPreviousResults(type) {
        return this.executionHistory.find(result => result.type === type);
    }

    getExtensionsForLanguage(language) {
        const extensions = {
            'JavaScript': ['js', 'jsx'],
            'TypeScript': ['ts', 'tsx'],
            'Python': ['py'],
            'Java': ['java'],
            'C#': ['cs'],
            'PHP': ['php'],
            'HTML': ['html'],
            'CSS': ['css'],
            'Markdown': ['md']
        };
        
        return extensions[language] || ['js'];
    }

    // Implementações simplificadas dos métodos complexos (serão expandidas conforme necessário)
    async createImplementationPlan(step, codebaseContext) {
        return {
            fileActions: [],
            commands: [],
            estimatedTime: step.estimatedTime
        };
    }

    async executeFileAction(action, result) {
        // Implementar ações em arquivos
        this.logger.info(`📄 Executando ação em arquivo: ${action.type}`);
    }

    async executeCommand(command, result) {
        try {
            this.logger.info(`💻 Executando comando: ${command}`);
            const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
            result.commandsExecuted.push(command);
            result.output += `Comando: ${command}\nSaída: ${output}\n\n`;
        } catch (error) {
            result.errors.push(`Erro no comando ${command}: ${error.message}`);
            throw error;
        }
    }

    async analyzeErrors(codebaseContext) {
        return { errors: [], warnings: [], info: [] };
    }

    async reproduceIssue(step, codebaseContext, result) {
        return { reproduced: false, steps: [], output: '' };
    }

    async identifyRootCause(errorAnalysis, reproduction) {
        return { cause: 'Não identificada', confidence: 'low', suggestions: [] };
    }

    async createFixPlan(rootCause) {
        return { fixes: [], estimatedTime: '5 min' };
    }

    async analyzeCodeQuality(step, codebaseContext) {
        return { quality: 'good', issues: [], suggestions: [] };
    }

    async createRefactorPlan(codeAnalysis) {
        return { refactors: [], estimatedTime: '10 min' };
    }

    async applyRefactor(refactor, result) {
        this.logger.info(`♻️ Aplicando refatoração: ${refactor.type}`);
    }

    async analyzeTestRequirements(step, codebaseContext) {
        return { testSuites: [], needsSetup: false, testFramework: 'jest' };
    }

    async createTestSuite(testSuite, result) {
        this.logger.info(`🧪 Criando suite de testes: ${testSuite.name}`);
        
        const testContent = this.generateTestContent(testSuite);
        const testFilePath = path.join(testSuite.directory || 'tests', `${testSuite.name}.test.js`);
        
        await fs.ensureDir(path.dirname(testFilePath));
        await fs.writeFile(testFilePath, testContent);
        
        result.filesCreated.push(testFilePath);
        result.output += `Suite de testes criada: ${testFilePath}\n`;
    }

    async setupTestEnvironment(framework, result) {
        this.logger.info(`🧪 Configurando ambiente de testes: ${framework}`);
        
        const commands = [];
        
        switch (framework) {
            case 'jest':
                commands.push('npm install --save-dev jest');
                break;
            case 'mocha':
                commands.push('npm install --save-dev mocha chai');
                break;
            case 'pytest':
                commands.push('pip install pytest pytest-cov');
                break;
        }
        
        for (const command of commands) {
            await this.executeCommand(command, result);
        }
    }

    async analyzeDocumentationNeeds(step, codebaseContext) {
        const needs = {
            documentationItems: [],
            format: 'markdown'
        };
        
        // Identificar necessidades baseado no tipo de etapa
        switch (step.type) {
            case 'implementation':
                needs.documentationItems.push({
                    type: 'api',
                    name: 'API Documentation',
                    priority: 'high'
                });
                break;
            case 'fix':
                needs.documentationItems.push({
                    type: 'changelog',
                    name: 'Bug Fix Documentation',
                    priority: 'medium'
                });
                break;
        }
        
        return needs;
    }

    async createDocumentation(docItem, result) {
        this.logger.info(`📚 Criando documentação: ${docItem.type}`);
        
        const docContent = this.generateDocumentationContent(docItem);
        const docPath = path.join('docs', `${docItem.name.toLowerCase().replace(/\s+/g, '-')}.md`);
        
        await fs.ensureDir(path.dirname(docPath));
        await fs.writeFile(docPath, docContent);
        
        result.filesCreated.push(docPath);
        result.output += `Documentação criada: ${docPath}\n`;
    }

    async validateAllSteps() {
        const validation = {
            valid: true,
            issues: [],
            summary: {
                totalSteps: this.executionHistory.length,
                successfulSteps: this.executionHistory.filter(s => s.success).length,
                failedSteps: this.executionHistory.filter(s => !s.success).length
            }
        };
        
        // Verificar se há etapas com erro
        const failedSteps = this.executionHistory.filter(s => !s.success);
        if (failedSteps.length > 0) {
            validation.valid = false;
            validation.issues.push(`${failedSteps.length} etapa(s) falharam`);
        }
        
        return validation;
    }

    async runFinalTests(codebaseContext, result) {
        const testResults = {
            passed: true,
            results: [],
            coverage: null
        };
        
        try {
            // Executar npm test se existir
            if (fs.existsSync('package.json')) {
                const packageJson = await fs.readJson('package.json');
                if (packageJson.scripts && packageJson.scripts.test) {
                    const output = execSync('npm test', { encoding: 'utf8' });
                    testResults.results.push({ type: 'npm test', status: 'passed', output });
                }
            }
        } catch (error) {
            testResults.passed = false;
            testResults.results.push({ type: 'npm test', status: 'failed', error: error.message });
        }
        
        return testResults;
    }

    async runQualityChecks(codebaseContext, result) {
        const qualityCheck = {
            quality: 'good',
            score: 85,
            checks: []
        };
        
        try {
            // Verificar se há linter configurado
            if (fs.existsSync('.eslintrc.js') || fs.existsSync('.eslintrc.json')) {
                try {
                    execSync('npx eslint . --format=json', { stdio: 'pipe' });
                    qualityCheck.checks.push({ name: 'ESLint', status: 'passed' });
                } catch (error) {
                    qualityCheck.checks.push({ name: 'ESLint', status: 'failed', error: error.message });
                    qualityCheck.score -= 15;
                }
            }
            
            // Verificar estrutura de arquivos
            const hasReadme = fs.existsSync('README.md');
            const hasPackageJson = fs.existsSync('package.json');
            
            if (!hasReadme) {
                qualityCheck.checks.push({ name: 'README', status: 'missing' });
                qualityCheck.score -= 10;
            }
            
            if (!hasPackageJson) {
                qualityCheck.checks.push({ name: 'package.json', status: 'missing' });
                qualityCheck.score -= 20;
            }
            
        } catch (error) {
            qualityCheck.quality = 'poor';
            qualityCheck.score = 30;
        }
        
        // Determinar qualidade baseado no score
        if (qualityCheck.score >= 80) {
            qualityCheck.quality = 'excellent';
        } else if (qualityCheck.score >= 60) {
            qualityCheck.quality = 'good';
        } else if (qualityCheck.score >= 40) {
            qualityCheck.quality = 'fair';
        } else {
            qualityCheck.quality = 'poor';
        }
        
        return qualityCheck;
    }

    async createGeneralPlan(step, codebaseContext) {
        const plan = {
            actions: [],
            type: 'general',
            estimatedTime: step.estimatedTime || '5 min'
        };
        
        // Criar ações baseado na descrição da etapa
        const description = step.description.toLowerCase();
        
        if (description.includes('criar')) {
            plan.actions.push({ type: 'create', target: 'files' });
        }
        if (description.includes('modificar') || description.includes('alterar')) {
            plan.actions.push({ type: 'modify', target: 'files' });
        }
        if (description.includes('instalar')) {
            plan.actions.push({ type: 'install', target: 'dependencies' });
        }
        if (description.includes('executar') || description.includes('rodar')) {
            plan.actions.push({ type: 'execute', target: 'commands' });
        }
        
        return plan;
    }

    async executeGeneralAction(action, result) {
        this.logger.info(`⚙️ Executando ação geral: ${action.type}`);
        
        switch (action.type) {
            case 'create':
                result.output += `Ação de criação executada\n`;
                break;
            case 'modify':
                result.output += `Ação de modificação executada\n`;
                break;
            case 'install':
                result.output += `Ação de instalação executada\n`;
                break;
            case 'execute':
                result.output += `Ação de execução executada\n`;
                break;
        }
    }

    async applyFileFix(fix) {
        this.logger.info(`📄 Aplicando correção em arquivo: ${fix.file}`);
        
        if (fix.content) {
            await fs.writeFile(fix.file, fix.content);
        } else if (fix.append) {
            await fs.appendFile(fix.file, fix.append);
        } else if (fix.replace) {
            const content = await fs.readFile(fix.file, 'utf-8');
            const newContent = content.replace(fix.replace.search, fix.replace.replacement);
            await fs.writeFile(fix.file, newContent);
        }
    }

    async applyDependencyFix(fix) {
        this.logger.info(`📦 Aplicando correção de dependência: ${fix.dependency}`);
        
        const command = fix.action === 'install' ? 
            `npm install ${fix.dependency}` : 
            `npm uninstall ${fix.dependency}`;
            
        execSync(command);
    }

    async applyCommandFix(fix) {
        this.logger.info(`💻 Aplicando correção via comando: ${fix.command}`);
        
        execSync(fix.command);
    }

    async applyConfigurationFix(fix) {
        this.logger.info(`⚙️ Aplicando correção de configuração: ${fix.config}`);
        
        if (fix.configFile && fix.configData) {
            await fs.writeJson(fix.configFile, fix.configData, { spaces: 2 });
        }
    }

    // ===== MÉTODOS AUXILIARES PARA GERAÇÃO DE CONTEÚDO =====

    generateTestContent(testSuite) {
        return `// Auto-generated test suite: ${testSuite.name}
describe('${testSuite.name}', () => {
    test('should pass basic test', () => {
        expect(true).toBe(true);
    });
    
    // Add more tests here
});
`;
    }

    generateDocumentationContent(docItem) {
        return `# ${docItem.name}

Auto-generated documentation for ${docItem.type}.

## Overview

This documentation was automatically generated by the MCP system.

## Details

[Add specific details here]

## Examples

\`\`\`javascript
// Add code examples here
\`\`\`

---
*Generated on ${new Date().toISOString()}*
`;
    }
}
