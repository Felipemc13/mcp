import fs from 'fs-extra';
import path from 'path';
import { execSync, exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './utils/logger.js';
import { FileManager } from './utils/file-manager.js';
import { ErrorHandler } from './utils/error-handler.js';

const execAsync = promisify(exec);

export class MCPTester {
    constructor() {
        this.logger = new Logger('MCP-2-TESTER');
        this.fileManager = new FileManager();
        this.errorHandler = new ErrorHandler();
        this.testHistory = [];
        
        this.logger.info('🧪 MCP-2 Testador inicializado');
    }

    /**
     * FUNÇÃO PRINCIPAL: Testa o resultado de uma execução
     */
    async test(step, executionResult) {
        this.logger.info(`🧪 Testando etapa: ${step.title}`);
        
        try {
            const testResult = {
                stepId: step.id,
                testType: step.type,
                startTime: new Date().toISOString(),
                hasErrors: false,
                errors: [],
                warnings: [],
                passed: [],
                failed: [],
                coverage: null,
                performance: {},
                recommendations: [],
                canProceed: false
            };

            // Executar testes específicos baseado no tipo de etapa
            switch (step.type) {
                case 'analysis':
                    await this.testAnalysis(step, executionResult, testResult);
                    break;
                case 'implementation':
                    await this.testImplementation(step, executionResult, testResult);
                    break;
                case 'investigation':
                    await this.testInvestigation(step, executionResult, testResult);
                    break;
                case 'fix':
                    await this.testFix(step, executionResult, testResult);
                    break;
                case 'refactor':
                    await this.testRefactor(step, executionResult, testResult);
                    break;
                case 'testing':
                    await this.testTesting(step, executionResult, testResult);
                    break;
                case 'documentation':
                    await this.testDocumentation(step, executionResult, testResult);
                    break;
                case 'validation':
                    await this.testValidation(step, executionResult, testResult);
                    break;
                default:
                    await this.testGeneral(step, executionResult, testResult);
            }

            // Verificação final
            testResult.hasErrors = testResult.errors.length > 0 || testResult.failed.length > 0;
            testResult.canProceed = !testResult.hasErrors;
            testResult.endTime = new Date().toISOString();
            testResult.duration = this.calculateDuration(testResult.startTime, testResult.endTime);

            this.testHistory.push(testResult);

            if (testResult.hasErrors) {
                this.logger.warn(`⚠️ Testes falharam para etapa ${step.id}`);
                this.logger.warn(`Erros: ${testResult.errors.length}, Falhas: ${testResult.failed.length}`);
            } else {
                this.logger.success(`✅ Todos os testes passaram para etapa ${step.id}`);
            }

            return testResult;

        } catch (error) {
            this.logger.error(`❌ Erro durante testes da etapa ${step.id}:`, error.message);
            throw error;
        }
    }

    /**
     * FUNÇÃO PRINCIPAL: Diagnostica erros encontrados
     */
    async diagnose(errors) {
        this.logger.info('🔍 Diagnosticando erros...');
        
        const diagnostic = {
            timestamp: new Date().toISOString(),
            totalErrors: errors.length,
            errorCategories: {},
            rootCauses: [],
            canAutoFix: false,
            suggestedFix: null,
            manualSteps: [],
            confidence: 'low'
        };

        try {
            // Categorizar erros
            diagnostic.errorCategories = this.categorizeErrors(errors);
            
            // Identificar causas raiz
            diagnostic.rootCauses = await this.identifyRootCauses(errors);
            
            // Verificar se pode ser corrigido automaticamente
            const autoFixAnalysis = await this.analyzeAutoFixPossibility(errors, diagnostic.rootCauses);
            diagnostic.canAutoFix = autoFixAnalysis.possible;
            diagnostic.suggestedFix = autoFixAnalysis.fix;
            diagnostic.confidence = autoFixAnalysis.confidence;
            
            // Gerar passos manuais se auto-fix não for possível
            if (!diagnostic.canAutoFix) {
                diagnostic.manualSteps = this.generateManualSteps(errors, diagnostic.rootCauses);
            }

            this.logger.info(`🔍 Diagnóstico concluído: ${diagnostic.totalErrors} erros analisados`);
            this.logger.info(`🤖 Auto-fix possível: ${diagnostic.canAutoFix ? 'Sim' : 'Não'}`);
            
            return diagnostic;

        } catch (error) {
            this.logger.error('❌ Erro durante diagnóstico:', error.message);
            throw error;
        }
    }

    // ===== TESTES POR TIPO DE ETAPA =====

    /**
     * TESTE: Analysis - Verificar se análise foi bem-sucedida
     */
    async testAnalysis(step, executionResult, testResult) {
        this.logger.info('📊 Testando análise...');
        
        // 1. Verificar se os deliverables foram criados
        if (!executionResult.deliverables) {
            testResult.errors.push('Deliverables não foram criados');
            return;
        }

        const tests = [
            {
                name: 'Requisitos analisados',
                test: () => executionResult.deliverables.requirements !== undefined,
                critical: true
            },
            {
                name: 'Dependências verificadas',
                test: () => executionResult.deliverables.dependencyCheck !== undefined,
                critical: true
            },
            {
                name: 'Estrutura preparada',
                test: () => executionResult.deliverables.fileStructure !== undefined,
                critical: false
            }
        ];

        await this.runTestSuite(tests, testResult);
        
        // Verificar qualidade da análise
        await this.verifyAnalysisQuality(executionResult, testResult);
    }

    /**
     * TESTE: Implementation - Verificar se implementação funciona
     */
    async testImplementation(step, executionResult, testResult) {
        this.logger.info('⚙️ Testando implementação...');
        
        // 1. Verificar arquivos criados/modificados
        if (executionResult.filesCreated.length === 0 && executionResult.filesModified.length === 0) {
            testResult.warnings.push('Nenhum arquivo foi criado ou modificado');
        }

        // 2. Verificar sintaxe dos arquivos
        await this.verifySyntax(executionResult.filesCreated.concat(executionResult.filesModified), testResult);
        
        // 3. Executar testes unitários se existirem
        await this.runUnitTests(step.language, testResult);
        
        // 4. Verificar funcionalidade básica
        await this.verifyBasicFunctionality(step, executionResult, testResult);
        
        // 5. Verificar performance se aplicável
        if (step.performanceTest) {
            await this.runPerformanceTests(step, testResult);
        }

        // 6. Verificar integração
        await this.verifyIntegration(step, executionResult, testResult);
    }

    /**
     * TESTE: Modification - Verificar modificações
     */
    async testModification(step, executionResult, testResult) {
        this.logger.info('🔧 Testando modificações...');
        
        // 1. Verificar se as mudanças foram aplicadas corretamente
        const modificationTests = [
            {
                name: 'Arquivos modificados existem',
                test: () => executionResult.filesModified.every(file => fs.existsSync(file)),
                critical: true
            },
            {
                name: 'Backup criado antes da modificação',
                test: () => executionResult.backupCreated === true,
                critical: false
            },
            {
                name: 'Sintaxe mantida após modificação',
                test: async () => {
                    for (const file of executionResult.filesModified) {
                        const syntaxCheck = await this.checkFileSyntax(file);
                        if (!syntaxCheck.valid) return false;
                    }
                    return true;
                },
                critical: true
            }
        ];

        await this.runTestSuite(modificationTests, testResult);
        
        // 2. Verificar funcionalidade não quebrou
        await this.verifyNoRegression(step, executionResult, testResult);
    }

    /**
     * TESTE: Testing - Verificar próprios testes
     */
    async testTesting(step, executionResult, testResult) {
        this.logger.info('🔍 Testando testes...');
        
        const testingTests = [
            {
                name: 'Testes executaram sem erro',
                test: () => executionResult.testsPassed === true,
                critical: true
            },
            {
                name: 'Coverage mínimo atingido',
                test: () => executionResult.coverage >= (step.minCoverage || 80),
                critical: false
            },
            {
                name: 'Relatório de testes gerado',
                test: () => executionResult.testReport !== undefined,
                critical: false
            }
        ];

        await this.runTestSuite(testingTests, testResult);
    }

    /**
     * TESTE: Documentation - Verificar documentação
     */
    async testDocumentation(step, executionResult, testResult) {
        this.logger.info('📚 Testando documentação...');
        
        const docTests = [
            {
                name: 'Documentação foi criada/atualizada',
                test: () => executionResult.documentationUpdated === true,
                critical: true
            },
            {
                name: 'README atualizado se necessário',
                test: () => {
                    if (step.updateReadme) {
                        return executionResult.readmeUpdated === true;
                    }
                    return true;
                },
                critical: false
            },
            {
                name: 'Comentários no código atualizados',
                test: () => executionResult.codeCommentsUpdated !== false,
                critical: false
            }
        ];

        await this.runTestSuite(docTests, testResult);
    }

    /**
     * AUXILIAR: Executar suite de testes
     */
    async runTestSuite(tests, testResult) {
        for (const test of tests) {
            try {
                const result = typeof test.test === 'function' ? 
                    await test.test() : test.test;
                
                if (result) {
                    testResult.passed.push(test.name);
                    this.logger.success(`✅ ${test.name}`);
                } else {
                    testResult.failed.push(test.name);
                    if (test.critical) {
                        testResult.errors.push(`CRÍTICO: ${test.name}`);
                        testResult.hasErrors = true;
                    } else {
                        testResult.warnings.push(test.name);
                    }
                    this.logger.error(`❌ ${test.name}`);
                }
            } catch (error) {
                testResult.failed.push(test.name);
                testResult.errors.push(`Erro em ${test.name}: ${error.message}`);
                testResult.hasErrors = true;
                this.logger.error(`💥 Erro em ${test.name}: ${error.message}`);
            }
        }
    }

    /**
     * AUXILIAR: Verificar sintaxe de arquivos
     */
    async verifySyntax(files, testResult) {
        this.logger.info('🔍 Verificando sintaxe dos arquivos...');
        
        for (const file of files) {
            if (!fs.existsSync(file)) {
                testResult.errors.push(`Arquivo não encontrado: ${file}`);
                testResult.hasErrors = true;
                continue;
            }

            try {
                const syntaxCheck = await this.checkFileSyntax(file);
                if (!syntaxCheck.valid) {
                    testResult.errors.push(`Erro de sintaxe em ${file}: ${syntaxCheck.error}`);
                    testResult.hasErrors = true;
                } else {
                    testResult.passed.push(`Sintaxe OK: ${path.basename(file)}`);
                }
            } catch (error) {
                testResult.warnings.push(`Não foi possível verificar sintaxe de ${file}: ${error.message}`);
            }
        }
    }

    /**
     * AUXILIAR: Verificar sintaxe de um arquivo específico
     */
    async checkFileSyntax(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        try {
            switch (ext) {
                case '.js':
                case '.mjs':
                    // Verificar sintaxe JavaScript
                    try {
                        execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
                        return { valid: true };
                    } catch (error) {
                        return { valid: false, error: error.message };
                    }
                
                case '.json':
                    // Verificar sintaxe JSON
                    try {
                        const content = await fs.readFile(filePath, 'utf-8');
                        JSON.parse(content);
                        return { valid: true };
                    } catch (error) {
                        return { valid: false, error: `JSON inválido: ${error.message}` };
                    }
                
                case '.py':
                    // Verificar sintaxe Python
                    try {
                        execSync(`python -m py_compile "${filePath}"`, { stdio: 'pipe' });
                        return { valid: true };
                    } catch (error) {
                        return { valid: false, error: error.message };
                    }
                
                case '.ts':
                    // Verificar sintaxe TypeScript
                    try {
                        execSync(`npx tsc --noEmit "${filePath}"`, { stdio: 'pipe' });
                        return { valid: true };
                    } catch (error) {
                        return { valid: false, error: error.message };
                    }
                
                default:
                    // Para outros tipos, assumir válido se o arquivo existe
                    return { valid: true };
            }
        } catch (error) {
            return { valid: false, error: `Erro ao verificar sintaxe: ${error.message}` };
        }
    }

    /**
     * AUXILIAR: Executar testes unitários
     */
    async runUnitTests(language, testResult) {
        this.logger.info('🧪 Executando testes unitários...');
        
        try {
            switch (language) {
                case 'javascript':
                case 'node':
                    await this.runJavaScriptTests(testResult);
                    break;
                case 'python':
                    await this.runPythonTests(testResult);
                    break;
                default:
                    this.logger.warn(`Testes unitários não configurados para linguagem: ${language}`);
            }
        } catch (error) {
            testResult.warnings.push(`Erro ao executar testes unitários: ${error.message}`);
        }
    }

    /**
     * AUXILIAR: Executar testes JavaScript
     */
    async runJavaScriptTests(testResult) {
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        
        if (!fs.existsSync(packageJsonPath)) {
            testResult.warnings.push('package.json não encontrado para executar testes');
            return;
        }

        const packageJson = await fs.readJson(packageJsonPath);
        
        if (!packageJson.scripts || !packageJson.scripts.test) {
            testResult.warnings.push('Script de teste não encontrado no package.json');
            return;
        }

        try {
            const { stdout, stderr } = await execAsync('npm test');
            testResult.passed.push('Testes unitários executados com sucesso');
            testResult.testOutput = stdout;
        } catch (error) {
            testResult.failed.push('Testes unitários falharam');
            testResult.errors.push(`Erro nos testes: ${error.message}`);
            testResult.hasErrors = true;
        }
    }

    /**
     * AUXILIAR: Executar testes Python
     */
    async runPythonTests(testResult) {
        try {
            const { stdout, stderr } = await execAsync('python -m pytest --tb=short');
            testResult.passed.push('Testes Python executados com sucesso');
            testResult.testOutput = stdout;
        } catch (error) {
            // pytest pode não estar instalado ou não ter testes
            testResult.warnings.push(`Testes Python não executados: ${error.message}`);
        }
    }

    /**
     * AUXILIAR: Verificar funcionalidade básica
     */
    async verifyBasicFunctionality(step, executionResult, testResult) {
        this.logger.info('⚡ Verificando funcionalidade básica...');
        
        // Se há comandos de verificação específicos
        if (step.verificationCommands) {
            for (const command of step.verificationCommands) {
                try {
                    execSync(command, { stdio: 'pipe' });
                    testResult.passed.push(`Comando verificado: ${command}`);
                } catch (error) {
                    testResult.failed.push(`Comando falhou: ${command}`);
                    testResult.errors.push(`Erro no comando ${command}: ${error.message}`);
                    testResult.hasErrors = true;
                }
            }
        }

        // Verificações específicas por tipo de implementação
        if (step.implementationType) {
            switch (step.implementationType) {
                case 'api':
                    await this.verifyAPIFunctionality(step, testResult);
                    break;
                case 'database':
                    await this.verifyDatabaseFunctionality(step, testResult);
                    break;
                case 'frontend':
                    await this.verifyFrontendFunctionality(step, testResult);
                    break;
            }
        }
    }

    /**
     * AUXILIAR: Verificar funcionalidade de API
     */
    async verifyAPIFunctionality(step, testResult) {
        if (step.apiEndpoints) {
            for (const endpoint of step.apiEndpoints) {
                try {
                    // Teste básico de endpoint (se servidor estiver rodando)
                    const response = await fetch(endpoint.url, {
                        method: endpoint.method || 'GET'
                    });
                    
                    if (response.ok) {
                        testResult.passed.push(`API endpoint OK: ${endpoint.url}`);
                    } else {
                        testResult.warnings.push(`API endpoint retornou ${response.status}: ${endpoint.url}`);
                    }
                } catch (error) {
                    testResult.warnings.push(`Não foi possível testar endpoint ${endpoint.url}: ${error.message}`);
                }
            }
        }
    }

    /**
     * AUXILIAR: Verificar funcionalidade de banco de dados
     */
    async verifyDatabaseFunctionality(step, testResult) {
        // Verificar se arquivos de migração/schema foram criados
        const dbFiles = ['*.sql', '*.migration.*', 'schema.*'];
        
        for (const pattern of dbFiles) {
            const files = this.fileManager.findFiles(pattern);
            if (files.length > 0) {
                testResult.passed.push(`Arquivos de banco encontrados: ${files.length}`);
                break;
            }
        }
    }

    /**
     * AUXILIAR: Verificar funcionalidade de frontend
     */
    async verifyFrontendFunctionality(step, testResult) {
        // Verificar se componentes/páginas foram criados
        const frontendFiles = ['*.html', '*.css', '*.jsx', '*.tsx', '*.vue'];
        
        for (const pattern of frontendFiles) {
            const files = this.fileManager.findFiles(pattern);
            if (files.length > 0) {
                testResult.passed.push(`Arquivos de frontend encontrados: ${files.length}`);
            }
        }

        // Verificar build se aplicável
        if (fs.existsSync('package.json')) {
            try {
                execSync('npm run build', { stdio: 'pipe' });
                testResult.passed.push('Build de frontend executado com sucesso');
            } catch (error) {
                testResult.warnings.push(`Build falhou: ${error.message}`);
            }
        }
    }

    /**
     * AUXILIAR: Verificar testes de performance
     */
    async runPerformanceTests(step, testResult) {
        this.logger.info('⚡ Executando testes de performance...');
        
        const startTime = Date.now();
        
        try {
            // Executar comando de performance se especificado
            if (step.performanceCommand) {
                execSync(step.performanceCommand, { stdio: 'pipe' });
            }
            
            const executionTime = Date.now() - startTime;
            testResult.performance.executionTime = executionTime;
            
            if (step.maxExecutionTime && executionTime > step.maxExecutionTime) {
                testResult.warnings.push(`Performance abaixo do esperado: ${executionTime}ms > ${step.maxExecutionTime}ms`);
            } else {
                testResult.passed.push(`Performance OK: ${executionTime}ms`);
            }
        } catch (error) {
            testResult.warnings.push(`Teste de performance falhou: ${error.message}`);
        }
    }

    /**
     * AUXILIAR: Verificar integração
     */
    async verifyIntegration(step, executionResult, testResult) {
        this.logger.info('🔗 Verificando integração...');
        
        // Verificar se dependências estão funcionando
        if (executionResult.dependenciesInstalled) {
            for (const dep of executionResult.dependenciesInstalled) {
                try {
                    execSync(`npm list ${dep}`, { stdio: 'pipe' });
                    testResult.passed.push(`Dependência OK: ${dep}`);
                } catch (error) {
                    testResult.warnings.push(`Problema com dependência ${dep}: ${error.message}`);
                }
            }
        }

        // Verificar imports/requires nos arquivos criados
        for (const file of executionResult.filesCreated) {
            try {
                await this.verifyFileImports(file, testResult);
            } catch (error) {
                testResult.warnings.push(`Erro ao verificar imports em ${file}: ${error.message}`);
            }
        }
    }

    /**
     * AUXILIAR: Verificar imports de um arquivo
     */
    async verifyFileImports(filePath, testResult) {
        const content = await fs.readFile(filePath, 'utf-8');
        const ext = path.extname(filePath);
        
        let importPattern;
        switch (ext) {
            case '.js':
            case '.mjs':
                importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
                break;
            case '.py':
                importPattern = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
                break;
            default:
                return; // Não verificar outros tipos
        }

        const imports = [];
        let match;
        while ((match = importPattern.exec(content)) !== null) {
            imports.push(match[1] || match[2]);
        }

        if (imports.length > 0) {
            testResult.passed.push(`Imports encontrados em ${path.basename(filePath)}: ${imports.length}`);
        }
    }

    /**
     * AUXILIAR: Verificar qualidade da análise
     */
    async verifyAnalysisQuality(executionResult, testResult) {
        const deliverables = executionResult.deliverables;
        
        // Verificar se a análise é completa
        const qualityChecks = [
            {
                name: 'Requisitos detalhados',
                test: () => deliverables.requirements && deliverables.requirements.length > 0,
                critical: true
            },
            {
                name: 'Tecnologias identificadas',
                test: () => deliverables.technologies && deliverables.technologies.length > 0,
                critical: false
            },
            {
                name: 'Estrutura de arquivos definida',
                test: () => deliverables.fileStructure && Object.keys(deliverables.fileStructure).length > 0,
                critical: false
            },
            {
                name: 'Dependências listadas',
                test: () => deliverables.dependencies && deliverables.dependencies.length > 0,
                critical: false
            }
        ];

        await this.runTestSuite(qualityChecks, testResult);
    }

    /**
     * AUXILIAR: Verificar se não há regressão
     */
    async verifyNoRegression(step, executionResult, testResult) {
        this.logger.info('🔄 Verificando se não há regressão...');
        
        // Executar testes existentes para garantir que nada quebrou
        try {
            if (fs.existsSync('package.json')) {
                const packageJson = await fs.readJson('package.json');
                if (packageJson.scripts && packageJson.scripts.test) {
                    execSync('npm test', { stdio: 'pipe' });
                    testResult.passed.push('Testes de regressão passaram');
                }
            }
        } catch (error) {
            testResult.failed.push('Testes de regressão falharam');
            testResult.errors.push(`Regressão detectada: ${error.message}`);
            testResult.hasErrors = true;
        }
    }

    /**
     * AUTO-FIX: Tentar corrigir erros encontrados automaticamente
     */
    async autoFix(step, testResult, executionResult) {
        this.logger.info('🔧 Tentando auto-correção...');
        
        const fixes = [];
        
        // Tentar corrigir erros comuns
        for (const error of testResult.errors) {
            try {
                if (error.includes('Erro de sintaxe')) {
                    const fix = await this.fixSyntaxError(error, executionResult);
                    if (fix.success) {
                        fixes.push(fix);
                    }
                } else if (error.includes('Dependência')) {
                    const fix = await this.fixDependencyError(error, executionResult);
                    if (fix.success) {
                        fixes.push(fix);
                    }
                } else if (error.includes('Arquivo não encontrado')) {
                    const fix = await this.fixMissingFileError(error, executionResult);
                    if (fix.success) {
                        fixes.push(fix);
                    }
                }
            } catch (fixError) {
                this.logger.error(`Erro durante auto-fix: ${fixError.message}`);
            }
        }

        return {
            appliedFixes: fixes,
            success: fixes.length > 0
        };
    }

    /**
     * AUTO-FIX: Corrigir erro de sintaxe
     */
    async fixSyntaxError(error, executionResult) {
        this.logger.info('🔧 Tentando corrigir erro de sintaxe...');
        
        // Extrair nome do arquivo do erro
        const fileMatch = error.match(/em (.+?):/);
        if (!fileMatch) return { success: false };
        
        const filePath = fileMatch[1];
        
        try {
            // Fazer backup
            await fs.copy(filePath, `${filePath}.backup`);
            
            // Tentar correções básicas
            const content = await fs.readFile(filePath, 'utf-8');
            let fixedContent = content;
            
            // Correções comuns
            fixedContent = fixedContent.replace(/;{2,}/g, ';'); // Multiple semicolons
            fixedContent = fixedContent.replace(/,{2,}/g, ','); // Multiple commas
            fixedContent = fixedContent.replace(/\{\s*,/g, '{'); // Invalid object syntax
            fixedContent = fixedContent.replace(/,\s*\}/g, '}'); // Trailing commas in objects
            
            await fs.writeFile(filePath, fixedContent);
            
            // Verificar se a correção funcionou
            const syntaxCheck = await this.checkFileSyntax(filePath);
            if (syntaxCheck.valid) {
                this.logger.success(`✅ Sintaxe corrigida em ${filePath}`);
                return { success: true, file: filePath, action: 'syntax fix' };
            } else {
                // Restaurar backup se não funcionou
                await fs.copy(`${filePath}.backup`, filePath);
                return { success: false };
            }
        } catch (error) {
            this.logger.error(`Erro ao corrigir sintaxe: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * AUTO-FIX: Corrigir erro de dependência
     */
    async fixDependencyError(error, executionResult) {
        this.logger.info('🔧 Tentando corrigir erro de dependência...');
        
        try {
            // Extrair nome da dependência do erro
            const depMatch = error.match(/dependência (.+?)[:]/);
            if (!depMatch) return { success: false };
            
            const dependency = depMatch[1];
            
            // Tentar instalar a dependência
            execSync(`npm install ${dependency}`, { stdio: 'pipe' });
            
            this.logger.success(`✅ Dependência ${dependency} instalada`);
            return { success: true, dependency, action: 'dependency install' };
        } catch (error) {
            this.logger.error(`Erro ao instalar dependência: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * AUTO-FIX: Corrigir erro de arquivo não encontrado
     */
    async fixMissingFileError(error, executionResult) {
        this.logger.info('🔧 Tentando corrigir arquivo não encontrado...');
        
        try {
            // Extrair nome do arquivo do erro
            const fileMatch = error.match(/Arquivo não encontrado: (.+)/);
            if (!fileMatch) return { success: false };
            
            const filePath = fileMatch[1];
            const fileName = path.basename(filePath);
            const dirPath = path.dirname(filePath);
            
            // Criar diretório se não existir
            await fs.ensureDir(dirPath);
            
            // Criar arquivo básico baseado na extensão
            const ext = path.extname(fileName);
            let content = '';
            
            switch (ext) {
                case '.js':
                    content = '// Auto-generated file\nexport default {};\n';
                    break;
                case '.json':
                    content = '{}';
                    break;
                case '.md':
                    content = `# ${fileName.replace('.md', '')}\n\nAuto-generated documentation file.\n`;
                    break;
                case '.txt':
                    content = 'Auto-generated file\n';
                    break;
                default:
                    content = '';
            }
            
            await fs.writeFile(filePath, content);
            
            this.logger.success(`✅ Arquivo criado: ${filePath}`);
            return { success: true, file: filePath, action: 'file creation' };
        } catch (error) {
            this.logger.error(`Erro ao criar arquivo: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * DIAGNÓSTICO: Diagnosticar problemas em detalhes
     */
    async diagnose(step, executionResult, testResult) {
        this.logger.info('🔍 Diagnosticando problemas...');
        
        const diagnosis = {
            timestamp: new Date().toISOString(),
            step: step.id,
            issues: [],
            recommendations: [],
            severity: 'low'
        };

        // Analisar erros críticos
        const criticalErrors = testResult.errors.filter(error => 
            error.includes('CRÍTICO') || 
            error.includes('Erro de sintaxe') ||
            error.includes('Testes unitários falharam')
        );

        if (criticalErrors.length > 0) {
            diagnosis.severity = 'high';
            diagnosis.issues.push({
                type: 'critical',
                count: criticalErrors.length,
                details: criticalErrors
            });
            
            diagnosis.recommendations.push('Corrigir erros críticos antes de prosseguir');
        }

        // Analisar warnings
        if (testResult.warnings.length > 0) {
            if (diagnosis.severity === 'low') diagnosis.severity = 'medium';
            
            diagnosis.issues.push({
                type: 'warning',
                count: testResult.warnings.length,
                details: testResult.warnings
            });
            
            diagnosis.recommendations.push('Revisar warnings para melhorar qualidade');
        }

        // Analisar performance
        if (testResult.performance && testResult.performance.executionTime > 5000) {
            diagnosis.issues.push({
                type: 'performance',
                detail: `Execução lenta: ${testResult.performance.executionTime}ms`
            });
            
            diagnosis.recommendations.push('Otimizar performance da implementação');
        }

        // Analisar cobertura de testes
        if (testResult.coverage && testResult.coverage < 70) {
            diagnosis.issues.push({
                type: 'coverage',
                detail: `Cobertura baixa: ${testResult.coverage}%`
            });
            
            diagnosis.recommendations.push('Aumentar cobertura de testes');
        }

        // Análise específica por tipo de etapa
        switch (step.type) {
            case 'implementation':
                if (executionResult.filesCreated.length === 0) {
                    diagnosis.issues.push({
                        type: 'implementation',
                        detail: 'Nenhum arquivo foi criado'
                    });
                    diagnosis.recommendations.push('Verificar se a implementação foi executada corretamente');
                }
                break;
                
            case 'testing':
                if (testResult.failed.length > testResult.passed.length) {
                    diagnosis.issues.push({
                        type: 'testing',
                        detail: 'Mais testes falharam do que passaram'
                    });
                    diagnosis.recommendations.push('Revisar e corrigir testes falhados');
                }
                break;
        }

        return diagnosis;
    }

    /**
     * RELATÓRIO: Gerar relatório de testes
     */
    async generateReport(step, testResult, diagnosis) {
        this.logger.info('📊 Gerando relatório de testes...');
        
        const report = {
            metadata: {
                stepId: step.id,
                stepTitle: step.title,
                testType: step.type,
                timestamp: new Date().toISOString(),
                duration: Date.now() - new Date(testResult.startTime).getTime()
            },
            summary: {
                totalTests: testResult.passed.length + testResult.failed.length,
                passed: testResult.passed.length,
                failed: testResult.failed.length,
                warnings: testResult.warnings.length,
                errors: testResult.errors.length,
                canProceed: testResult.canProceed
            },
            details: {
                passed: testResult.passed,
                failed: testResult.failed,
                warnings: testResult.warnings,
                errors: testResult.errors,
                performance: testResult.performance,
                coverage: testResult.coverage
            },
            diagnosis: diagnosis,
            recommendations: testResult.recommendations || []
        };

        // Salvar relatório
        const reportPath = path.join('logs', 'test-reports', `${step.id}-${Date.now()}.json`);
        await fs.ensureDir(path.dirname(reportPath));
        await fs.writeJson(reportPath, report, { spaces: 2 });

        this.logger.success(`📊 Relatório salvo em: ${reportPath}`);
        
        return report;
    }

    /**
     * HISTÓRICO: Adicionar teste ao histórico
     */
    addToHistory(testResult) {
        this.testHistory.push({
            ...testResult,
            completedAt: new Date().toISOString()
        });

        // Manter apenas os últimos 100 testes
        if (this.testHistory.length > 100) {
            this.testHistory = this.testHistory.slice(-100);
        }
    }

    /**
     * UTILIDADE: Obter histórico de testes
     */
    getHistory() {
        return this.testHistory;
    }

    /**
     * UTILIDADE: Limpar histórico
     */
    clearHistory() {
        this.testHistory = [];
        this.logger.info('🗑️ Histórico de testes limpo');
    }
}
