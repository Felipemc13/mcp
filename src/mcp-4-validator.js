import fs from 'fs-extra';
import path from 'path';
import { Logger } from './utils/logger.js';
import { FileManager } from './utils/file-manager.js';
import { ErrorHandler } from './utils/error-handler.js';

export class MCPValidator {
    constructor() {
        this.logger = new Logger('MCP-4-VALIDATOR');
        this.fileManager = new FileManager();
        this.errorHandler = new ErrorHandler();
        this.validationHistory = [];
        
        this.logger.info('✅ MCP-4 Validador inicializado');
    }

    /**
     * FUNÇÃO PRINCIPAL: Valida o resultado de uma etapa
     */
    async validate(step, executionResult, testResult) {
        this.logger.info(`✅ Validando etapa: ${step.title}`);
        
        try {
            const validationResult = {
                stepId: step.id,
                stepTitle: step.title,
                timestamp: new Date().toISOString(),
                approved: false,
                confidence: 'low',
                reasons: [],
                recommendations: [],
                nextStepApproved: false,
                finalApproval: false,
                qualityScore: 0,
                completeness: 0,
                metrics: {}
            };

            // Validação específica por tipo de etapa
            switch (step.type) {
                case 'analysis':
                    await this.validateAnalysis(step, executionResult, testResult, validationResult);
                    break;
                case 'implementation':
                    await this.validateImplementation(step, executionResult, testResult, validationResult);
                    break;
                case 'investigation':
                    await this.validateInvestigation(step, executionResult, testResult, validationResult);
                    break;
                case 'fix':
                    await this.validateFix(step, executionResult, testResult, validationResult);
                    break;
                case 'refactor':
                    await this.validateRefactor(step, executionResult, testResult, validationResult);
                    break;
                case 'testing':
                    await this.validateTesting(step, executionResult, testResult, validationResult);
                    break;
                case 'documentation':
                    await this.validateDocumentation(step, executionResult, testResult, validationResult);
                    break;
                case 'validation':
                    await this.validateValidation(step, executionResult, testResult, validationResult);
                    break;
                default:
                    await this.validateGeneral(step, executionResult, testResult, validationResult);
            }

            // Validação geral obrigatória
            await this.performGeneralValidation(step, executionResult, testResult, validationResult);
            
            // Calcular score final e aprovação
            await this.calculateFinalApproval(validationResult);
            
            // Verificar se pode prosseguir para próxima etapa
            await this.checkNextStepReadiness(step, validationResult);

            this.validationHistory.push(validationResult);
            
            if (validationResult.approved) {
                this.logger.success(`✅ Etapa ${step.id} APROVADA (Score: ${validationResult.qualityScore})`);
            } else {
                this.logger.warn(`⚠️ Etapa ${step.id} REJEITADA: ${validationResult.reasons.join(', ')}`);
            }
            
            return validationResult;

        } catch (error) {
            this.logger.error(`❌ Erro na validação da etapa ${step.id}:`, error.message);
            throw error;
        }
    }

    // ===== VALIDAÇÃO POR TIPO DE ETAPA =====

    /**
     * VALIDA: Analysis - Análise e preparação
     */
    async validateAnalysis(step, executionResult, testResult, validationResult) {
        this.logger.info('📊 Validando análise...');
        
        const criteria = [
            {
                name: 'Requisitos analisados',
                check: () => executionResult.deliverables?.requirements !== undefined,
                weight: 30,
                critical: true
            },
            {
                name: 'Dependências verificadas',
                check: () => executionResult.deliverables?.dependencyCheck !== undefined,
                weight: 25,
                critical: true
            },
            {
                name: 'Estrutura preparada',
                check: () => executionResult.deliverables?.fileStructure !== undefined,
                weight: 20,
                critical: false
            },
            {
                name: 'Execução sem erros',
                check: () => testResult.errors.length === 0,
                weight: 25,
                critical: true
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
        
        // Validações específicas de análise
        if (executionResult.deliverables?.dependencyCheck?.missing?.length > 0) {
            const allInstalled = await this.verifyDependenciesInstalled(executionResult.deliverables.dependencyCheck.missing);
            if (!allInstalled) {
                validationResult.reasons.push('Dependências ainda não instaladas');
                validationResult.recommendations.push('Instalar dependências faltantes antes de prosseguir');
            }
        }
    }

    /**
     * VALIDA: Implementation - Implementação
     */
    async validateImplementation(step, executionResult, testResult, validationResult) {
        this.logger.info('⚙️ Validando implementação...');
        
        const criteria = [
            {
                name: 'Arquivos criados/modificados',
                check: () => (executionResult.filesCreated.length + executionResult.filesModified.length) > 0,
                weight: 25,
                critical: true
            },
            {
                name: 'Sintaxe válida',
                check: () => !testResult.errors.some(e => e.includes('syntax') || e.includes('Syntax')),
                weight: 30,
                critical: true
            },
            {
                name: 'Funcionalidade básica',
                check: () => testResult.passed.some(p => p.includes('funcionalidade') || p.includes('básica')),
                weight: 25,
                critical: false
            },
            {
                name: 'Sem regressões',
                check: () => !testResult.warnings.some(w => w.includes('regressão')),
                weight: 20,
                critical: false
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
        
        // Validar arquivos criados existem e são válidos
        await this.validateCreatedFiles(executionResult.filesCreated, validationResult);
        
        // Verificar se implementação atende aos requisitos
        await this.verifyRequirementsFulfillment(step, executionResult, validationResult);
    }

    /**
     * VALIDA: Investigation - Investigação
     */
    async validateInvestigation(step, executionResult, testResult, validationResult) {
        this.logger.info('🔍 Validando investigação...');
        
        const criteria = [
            {
                name: 'Análise de erros completa',
                check: () => executionResult.deliverables?.errorAnalysis !== undefined,
                weight: 30,
                critical: true
            },
            {
                name: 'Problema reproduzido',
                check: () => executionResult.deliverables?.reproduction !== undefined,
                weight: 25,
                critical: true
            },
            {
                name: 'Causa raiz identificada',
                check: () => executionResult.deliverables?.rootCause !== undefined,
                weight: 25,
                critical: true
            },
            {
                name: 'Solução proposta',
                check: () => executionResult.deliverables?.proposedSolution !== undefined,
                weight: 20,
                critical: false
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
        
        // Verificar se a investigação foi completa
        if (executionResult.deliverables?.errorAnalysis) {
            const analysis = executionResult.deliverables.errorAnalysis;
            if (!analysis.stackTrace && !analysis.errorMessage) {
                validationResult.reasons.push('Análise de erro incompleta');
            }
        }
    }

    /**
     * VALIDA: Fix - Correção
     */
    async validateFix(step, executionResult, testResult, validationResult) {
        this.logger.info('🔧 Validando correção...');
        
        const criteria = [
            {
                name: 'Correção aplicada',
                check: () => executionResult.fixApplied === true,
                weight: 40,
                critical: true
            },
            {
                name: 'Testes passando',
                check: () => testResult.failed.length === 0,
                weight: 30,
                critical: true
            },
            {
                name: 'Problema original resolvido',
                check: () => executionResult.originalProblemSolved === true,
                weight: 20,
                critical: true
            },
            {
                name: 'Sem efeitos colaterais',
                check: () => !testResult.warnings.some(w => w.includes('regressão')),
                weight: 10,
                critical: false
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
        
        // Verificar se o problema original foi realmente resolvido
        if (step.originalError && executionResult.verificationResult) {
            const solved = await this.verifyOriginalErrorFixed(step.originalError, executionResult.verificationResult);
            if (!solved) {
                validationResult.reasons.push('Problema original ainda não foi resolvido');
            }
        }
    }

    /**
     * VALIDA: Refactor - Refatoração
     */
    async validateRefactor(step, executionResult, testResult, validationResult) {
        this.logger.info('♻️ Validando refatoração...');
        
        const criteria = [
            {
                name: 'Funcionalidade preservada',
                check: () => testResult.passed.some(p => p.includes('regressão') && p.includes('passaram')),
                weight: 40,
                critical: true
            },
            {
                name: 'Código melhorado',
                check: () => executionResult.codeQualityImproved === true,
                weight: 25,
                critical: false
            },
            {
                name: 'Performance mantida/melhorada',
                check: () => {
                    if (testResult.performance && testResult.performance.executionTime) {
                        return testResult.performance.executionTime <= (step.maxExecutionTime || 5000);
                    }
                    return true;
                },
                weight: 20,
                critical: false
            },
            {
                name: 'Estrutura de arquivos otimizada',
                check: () => executionResult.fileStructureOptimized !== false,
                weight: 15,
                critical: false
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
    }

    /**
     * VALIDA: Testing - Testes
     */
    async validateTesting(step, executionResult, testResult, validationResult) {
        this.logger.info('🧪 Validando testes...');
        
        const criteria = [
            {
                name: 'Testes executados com sucesso',
                check: () => testResult.testsPassed === true,
                weight: 40,
                critical: true
            },
            {
                name: 'Cobertura adequada',
                check: () => {
                    const minCoverage = step.minCoverage || 70;
                    return testResult.coverage >= minCoverage;
                },
                weight: 30,
                critical: false
            },
            {
                name: 'Casos de teste abrangentes',
                check: () => executionResult.testCasesCreated > 0,
                weight: 20,
                critical: false
            },
            {
                name: 'Relatório de testes gerado',
                check: () => executionResult.testReport !== undefined,
                weight: 10,
                critical: false
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
        
        // Verificar qualidade dos testes
        if (executionResult.testCasesCreated > 0) {
            validationResult.metrics.testCases = executionResult.testCasesCreated;
            validationResult.metrics.coverage = testResult.coverage;
        }
    }

    /**
     * VALIDA: Documentation - Documentação
     */
    async validateDocumentation(step, executionResult, testResult, validationResult) {
        this.logger.info('📚 Validando documentação...');
        
        const criteria = [
            {
                name: 'Documentação criada/atualizada',
                check: () => executionResult.documentationUpdated === true,
                weight: 40,
                critical: true
            },
            {
                name: 'README atualizado se necessário',
                check: () => {
                    if (step.updateReadme) {
                        return executionResult.readmeUpdated === true;
                    }
                    return true;
                },
                weight: 25,
                critical: false
            },
            {
                name: 'Comentários no código adequados',
                check: () => executionResult.codeCommentsUpdated !== false,
                weight: 20,
                critical: false
            },
            {
                name: 'Exemplos de uso incluídos',
                check: () => executionResult.examplesIncluded !== false,
                weight: 15,
                critical: false
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
        
        // Verificar qualidade da documentação
        await this.validateDocumentationQuality(executionResult, validationResult);
    }

    /**
     * VALIDA: Validation - Validação
     */
    async validateValidation(step, executionResult, testResult, validationResult) {
        this.logger.info('✅ Validando validação...');
        
        const criteria = [
            {
                name: 'Validação executada',
                check: () => executionResult.validationPerformed === true,
                weight: 50,
                critical: true
            },
            {
                name: 'Critérios atendidos',
                check: () => executionResult.criteriasMet === true,
                weight: 30,
                critical: true
            },
            {
                name: 'Relatório de validação gerado',
                check: () => executionResult.validationReport !== undefined,
                weight: 20,
                critical: false
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
    }

    /**
     * VALIDA: Geral - Para tipos não específicos
     */
    async validateGeneral(step, executionResult, testResult, validationResult) {
        this.logger.info('📋 Validando etapa geral...');
        
        const criteria = [
            {
                name: 'Execução completada',
                check: () => executionResult.completed === true,
                weight: 40,
                critical: true
            },
            {
                name: 'Sem erros críticos',
                check: () => testResult.errors.length === 0,
                weight: 30,
                critical: true
            },
            {
                name: 'Objetivos atingidos',
                check: () => executionResult.objectivesAchieved !== false,
                weight: 20,
                critical: false
            },
            {
                name: 'Deliverables criados',
                check: () => executionResult.deliverables !== undefined,
                weight: 10,
                critical: false
            }
        ];

        await this.evaluateCriteria(criteria, validationResult);
    }

    /**
     * FUNÇÃO AUXILIAR: Avaliar critérios de validação
     */
    async evaluateCriteria(criteria, validationResult) {
        let totalWeight = 0;
        let achievedWeight = 0;
        let criticalFailures = 0;

        for (const criterion of criteria) {
            try {
                const passed = typeof criterion.check === 'function' ? 
                    await criterion.check() : criterion.check;
                
                totalWeight += criterion.weight;
                
                if (passed) {
                    achievedWeight += criterion.weight;
                    validationResult.reasons.push(`✅ ${criterion.name}`);
                } else {
                    validationResult.reasons.push(`❌ ${criterion.name}`);
                    if (criterion.critical) {
                        criticalFailures++;
                    }
                }
            } catch (error) {
                validationResult.reasons.push(`⚠️ Erro ao verificar ${criterion.name}: ${error.message}`);
                if (criterion.critical) {
                    criticalFailures++;
                }
            }
        }

        validationResult.qualityScore = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
        validationResult.completeness = criteria.length > 0 ? 
            Math.round((criteria.filter(c => validationResult.reasons.some(r => r.includes(`✅ ${c.name}`))).length / criteria.length) * 100) : 0;

        // Se há falhas críticas, não aprovar
        if (criticalFailures > 0) {
            validationResult.confidence = 'low';
            validationResult.recommendations.push(`Corrigir ${criticalFailures} falha(s) crítica(s)`);
        } else if (validationResult.qualityScore >= 80) {
            validationResult.confidence = 'high';
        } else if (validationResult.qualityScore >= 60) {
            validationResult.confidence = 'medium';
        } else {
            validationResult.confidence = 'low';
        }
    }

    /**
     * VALIDAÇÃO GERAL: Aplicada a todas as etapas
     */
    async performGeneralValidation(step, executionResult, testResult, validationResult) {
        this.logger.info('🔍 Executando validação geral...');
        
        // Verificar tempo de execução
        if (executionResult.executionTime && executionResult.executionTime > 300000) { // 5 minutos
            validationResult.reasons.push('⚠️ Tempo de execução muito longo');
            validationResult.recommendations.push('Otimizar tempo de execução');
        }

        // Verificar uso de recursos
        if (executionResult.memoryUsage && executionResult.memoryUsage > 512) { // 512MB
            validationResult.reasons.push('⚠️ Alto uso de memória');
            validationResult.recommendations.push('Otimizar uso de memória');
        }

        // Verificar logs de erro
        if (executionResult.logs && executionResult.logs.some(log => log.level === 'error')) {
            validationResult.reasons.push('⚠️ Logs de erro encontrados');
            validationResult.recommendations.push('Revisar e resolver erros nos logs');
        }

        // Verificar se deliverables são válidos
        if (executionResult.deliverables) {
            const deliverablesValid = await this.validateDeliverables(executionResult.deliverables);
            if (!deliverablesValid) {
                validationResult.reasons.push('❌ Deliverables inválidos');
            }
        }

        // Verificar backup se modificações foram feitas
        if (executionResult.filesModified && executionResult.filesModified.length > 0) {
            if (!executionResult.backupCreated) {
                validationResult.reasons.push('⚠️ Backup não foi criado antes das modificações');
                validationResult.recommendations.push('Criar backup antes de modificar arquivos');
            }
        }
    }

    /**
     * AUXILIAR: Calcular aprovação final
     */
    async calculateFinalApproval(validationResult) {
        // Critérios para aprovação
        const hasNoCriticalFailures = !validationResult.reasons.some(r => r.includes('❌') && r.includes('CRÍTICO'));
        const hasMinimumScore = validationResult.qualityScore >= 70;
        const hasHighConfidence = validationResult.confidence === 'high' || 
            (validationResult.confidence === 'medium' && validationResult.qualityScore >= 80);

        validationResult.approved = hasNoCriticalFailures && hasMinimumScore;
        validationResult.finalApproval = validationResult.approved && hasHighConfidence;

        // Determinar nível de confiança final
        if (validationResult.qualityScore >= 90 && hasNoCriticalFailures) {
            validationResult.confidence = 'high';
        } else if (validationResult.qualityScore >= 70 && hasNoCriticalFailures) {
            validationResult.confidence = 'medium';
        } else {
            validationResult.confidence = 'low';
        }

        // Adicionar recomendações baseadas no score
        if (validationResult.qualityScore < 70) {
            validationResult.recommendations.push('Melhorar qualidade geral antes de prosseguir');
        }
        if (validationResult.completeness < 80) {
            validationResult.recommendations.push('Completar tarefas pendentes');
        }
    }

    /**
     * AUXILIAR: Verificar se pode prosseguir para próxima etapa
     */
    async checkNextStepReadiness(step, validationResult) {
        validationResult.nextStepApproved = validationResult.approved;
        
        // Verificações adicionais específicas por tipo
        switch (step.type) {
            case 'analysis':
                // Análise deve estar completa para implementação
                validationResult.nextStepApproved = validationResult.approved && 
                    validationResult.qualityScore >= 80;
                break;
                
            case 'implementation':
                // Implementação deve passar em todos os testes para documentação
                validationResult.nextStepApproved = validationResult.approved && 
                    validationResult.reasons.some(r => r.includes('✅') && r.includes('Funcionalidade'));
                break;
                
            case 'fix':
                // Correção deve resolver o problema original
                validationResult.nextStepApproved = validationResult.approved && 
                    validationResult.reasons.some(r => r.includes('✅') && r.includes('problema original'));
                break;
        }

        if (!validationResult.nextStepApproved) {
            validationResult.recommendations.push('Completar etapa atual antes de prosseguir');
        }
    }

    // ===== VERIFICAÇÕES ESPECÍFICAS =====

    /**
     * AUXILIAR: Verificar se dependências foram instaladas
     */
    async verifyDependenciesInstalled(dependencies) {
        const { execSync } = await import('child_process');
        
        for (const dep of dependencies) {
            try {
                execSync(`npm list ${dep}`, { stdio: 'ignore' });
            } catch (error) {
                return false;
            }
        }
        return true;
    }

    /**
     * AUXILIAR: Validar arquivos criados
     */
    async validateCreatedFiles(files, validationResult) {
        let validFiles = 0;
        
        for (const file of files) {
            if (await fs.pathExists(file)) {
                validFiles++;
                
                // Verificar se o arquivo não está vazio
                const stats = await fs.stat(file);
                if (stats.size === 0) {
                    validationResult.reasons.push(`⚠️ Arquivo vazio: ${path.basename(file)}`);
                } else {
                    validationResult.reasons.push(`✅ Arquivo válido: ${path.basename(file)}`);
                }
            } else {
                validationResult.reasons.push(`❌ Arquivo não encontrado: ${path.basename(file)}`);
            }
        }

        if (files.length > 0) {
            validationResult.metrics.filesValidation = `${validFiles}/${files.length}`;
        }
    }

    /**
     * AUXILIAR: Verificar se requisitos foram atendidos
     */
    async verifyRequirementsFulfillment(step, executionResult, validationResult) {
        if (step.requirements && step.requirements.length > 0) {
            let fulfilledCount = 0;
            
            for (const requirement of step.requirements) {
                const fulfilled = await this.checkRequirementFulfillment(requirement, executionResult);
                if (fulfilled) {
                    fulfilledCount++;
                    validationResult.reasons.push(`✅ Requisito atendido: ${requirement.name}`);
                } else {
                    validationResult.reasons.push(`❌ Requisito não atendido: ${requirement.name}`);
                }
            }

            validationResult.metrics.requirementsFulfillment = `${fulfilledCount}/${step.requirements.length}`;
            
            if (fulfilledCount < step.requirements.length) {
                validationResult.recommendations.push('Atender todos os requisitos especificados');
            }
        }
    }

    /**
     * AUXILIAR: Verificar se um requisito foi atendido
     */
    async checkRequirementFulfillment(requirement, executionResult) {
        switch (requirement.type) {
            case 'file':
                return executionResult.filesCreated.includes(requirement.value) ||
                       executionResult.filesModified.includes(requirement.value);
            
            case 'function':
                // Verificar se função foi implementada (simplificado)
                return executionResult.functionsImplemented?.includes(requirement.value) || false;
            
            case 'test':
                return executionResult.testsCreated?.includes(requirement.value) || false;
            
            case 'dependency':
                return executionResult.dependenciesInstalled?.includes(requirement.value) || false;
            
            default:
                return true; // Assumir atendido se não souber como verificar
        }
    }

    /**
     * AUXILIAR: Verificar se erro original foi corrigido
     */
    async verifyOriginalErrorFixed(originalError, verificationResult) {
        if (!verificationResult) return false;
        
        // Verificar se o erro específico foi resolvido
        return verificationResult.errorResolved === true ||
               !verificationResult.remainingErrors?.includes(originalError.message);
    }

    /**
     * AUXILIAR: Validar qualidade da documentação
     */
    async validateDocumentationQuality(executionResult, validationResult) {
        if (executionResult.documentationFiles) {
            for (const docFile of executionResult.documentationFiles) {
                if (await fs.pathExists(docFile)) {
                    const content = await fs.readFile(docFile, 'utf-8');
                    
                    // Verificações básicas de qualidade
                    const hasTitle = content.includes('#') || content.includes('<h');
                    const hasExamples = content.includes('```') || content.includes('exemplo');
                    const hasMinimumLength = content.length > 100;
                    
                    if (hasTitle && hasExamples && hasMinimumLength) {
                        validationResult.reasons.push(`✅ Documentação de qualidade: ${path.basename(docFile)}`);
                    } else {
                        validationResult.reasons.push(`⚠️ Documentação básica: ${path.basename(docFile)}`);
                    }
                }
            }
        }
    }

    /**
     * AUXILIAR: Validar deliverables
     */
    async validateDeliverables(deliverables) {
        if (!deliverables || typeof deliverables !== 'object') {
            return false;
        }

        // Verificar se deliverables não está vazio
        const keys = Object.keys(deliverables);
        if (keys.length === 0) {
            return false;
        }

        // Verificar se os valores não são undefined ou null
        for (const key of keys) {
            if (deliverables[key] === undefined || deliverables[key] === null) {
                return false;
            }
        }

        return true;
    }

    /**
     * UTILIDADE: Obter histórico de validações
     */
    getValidationHistory() {
        return this.validationHistory;
    }

    /**
     * UTILIDADE: Obter estatísticas de validação
     */
    getValidationStats() {
        if (this.validationHistory.length === 0) {
            return {
                total: 0,
                approved: 0,
                rejected: 0,
                averageScore: 0,
                averageCompleteness: 0
            };
        }

        const approved = this.validationHistory.filter(v => v.approved).length;
        const rejected = this.validationHistory.length - approved;
        const averageScore = this.validationHistory.reduce((sum, v) => sum + v.qualityScore, 0) / this.validationHistory.length;
        const averageCompleteness = this.validationHistory.reduce((sum, v) => sum + v.completeness, 0) / this.validationHistory.length;

        return {
            total: this.validationHistory.length,
            approved,
            rejected,
            approvalRate: Math.round((approved / this.validationHistory.length) * 100),
            averageScore: Math.round(averageScore),
            averageCompleteness: Math.round(averageCompleteness),
            lastValidation: this.validationHistory[this.validationHistory.length - 1]?.timestamp
        };
    }

    /**
     * UTILIDADE: Limpar histórico de validação
     */
    clearValidationHistory() {
        this.validationHistory = [];
        this.logger.info('🗑️ Histórico de validação limpo');
    }

    /**
     * UTILIDADE: Exportar relatório de validação
     */
    async exportValidationReport(stepId, format = 'json') {
        const validation = this.validationHistory.find(v => v.stepId === stepId);
        if (!validation) {
            throw new Error(`Validação não encontrada para etapa: ${stepId}`);
        }

        const reportPath = path.join('logs', 'validation-reports');
        await fs.ensureDir(reportPath);

        let fileName, content;
        
        if (format === 'json') {
            fileName = `validation-${stepId}-${Date.now()}.json`;
            content = JSON.stringify(validation, null, 2);
        } else if (format === 'markdown') {
            fileName = `validation-${stepId}-${Date.now()}.md`;
            const report = this.generateValidationReport(validation);
            content = report.content;
        } else {
            throw new Error(`Formato não suportado: ${format}`);
        }

        const fullPath = path.join(reportPath, fileName);
        await fs.writeFile(fullPath, content);

        this.logger.success(`📊 Relatório exportado: ${fullPath}`);
        return fullPath;
    }

    /**
     * UTILIDADE: Validar múltiplas etapas
     */
    async validateMultipleSteps(steps, executionResults, testResults) {
        const validations = [];
        
        for (let i = 0; i < steps.length; i++) {
            try {
                const validation = await this.validate(steps[i], executionResults[i], testResults[i]);
                validations.push(validation);
                
                // Se uma etapa não foi aprovada, parar
                if (!validation.approved) {
                    this.logger.warn(`⚠️ Validação falhou na etapa ${steps[i].id}, parando processo`);
                    break;
                }
            } catch (error) {
                this.logger.error(`❌ Erro na validação da etapa ${steps[i].id}: ${error.message}`);
                validations.push({
                    stepId: steps[i].id,
                    approved: false,
                    error: error.message
                });
                break;
            }
        }

        return validations;
    }
}
