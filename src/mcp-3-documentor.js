import fs from 'fs-extra';
import path from 'path';
import { Logger } from './utils/logger.js';
import { FileManager } from './utils/file-manager.js';

export class MCPDocumentor {
    constructor() {
        this.logger = new Logger('MCP-3-DOCUMENTOR');
        this.fileManager = new FileManager();
        this.documentationHistory = [];
        
        this.logger.info('📚 MCP-3 Documentador inicializado');
    }

    /**
     * FUNÇÃO PRINCIPAL: Documenta o resultado de uma etapa
     */
    async document(step, executionResult, testResult) {
        this.logger.info(`📚 Documentando etapa: ${step.title}`);
        
        try {
            const documentationResult = {
                stepId: step.id,
                stepTitle: step.title,
                timestamp: new Date().toISOString(),
                documentationType: step.type,
                filesCreated: [],
                sectionsUpdated: [],
                format: 'markdown'
            };

            // Criar documentação específica baseada no tipo de etapa
            switch (step.type) {
                case 'analysis':
                    await this.documentAnalysis(step, executionResult, testResult, documentationResult);
                    break;
                case 'implementation':
                    await this.documentImplementation(step, executionResult, testResult, documentationResult);
                    break;
                case 'investigation':
                    await this.documentInvestigation(step, executionResult, testResult, documentationResult);
                    break;
                case 'fix':
                    await this.documentFix(step, executionResult, testResult, documentationResult);
                    break;
                case 'refactor':
                    await this.documentRefactor(step, executionResult, testResult, documentationResult);
                    break;
                case 'testing':
                    await this.documentTesting(step, executionResult, testResult, documentationResult);
                    break;
                case 'documentation':
                    await this.documentDocumentation(step, executionResult, testResult, documentationResult);
                    break;
                case 'validation':
                    await this.documentValidation(step, executionResult, testResult, documentationResult);
                    break;
                default:
                    await this.documentGeneral(step, executionResult, testResult, documentationResult);
            }

            // Atualizar índice de documentação
            await this.updateDocumentationIndex(documentationResult);
            
            // Atualizar README principal se necessário
            await this.updateMainReadme(step, documentationResult);

            this.documentationHistory.push(documentationResult);
            this.logger.success(`✅ Documentação da etapa ${step.id} concluída`);
            
            return documentationResult;

        } catch (error) {
            this.logger.error(`❌ Erro na documentação da etapa ${step.id}:`, error.message);
            throw error;
        }
    }

    // ===== DOCUMENTAÇÃO POR TIPO DE ETAPA =====

    /**
     * DOCUMENTA: Analysis - Análise e preparação
     */
    async documentAnalysis(step, executionResult, testResult, docResult) {
        this.logger.info('📊 Documentando análise...');
        
        const analysisDoc = this.generateAnalysisDocument(step, executionResult, testResult);
        const docPath = await this.saveDocument('analysis', `analise-etapa-${step.id}`, analysisDoc);
        
        docResult.filesCreated.push(docPath);
        docResult.sectionsUpdated.push('Análise de Requisitos');
        
        // Atualizar seção de análise no README
        await this.updateReadmeSection('análise', analysisDoc.summary);
    }

    /**
     * DOCUMENTA: Implementation - Implementação
     */
    async documentImplementation(step, executionResult, testResult, docResult) {
        this.logger.info('⚙️ Documentando implementação...');
        
        // 1. Documentar código implementado
        await this.documentCodeChanges(executionResult, docResult);
        
        // 2. Gerar documentação de API se aplicável
        await this.generateAPIDocumentation(executionResult, docResult);
        
        // 3. Criar guias de uso
        await this.createUsageGuides(step, executionResult, docResult);
        
        // 4. Documentar decisões técnicas
        await this.documentTechnicalDecisions(step, executionResult, docResult);
    }

    /**
     * DOCUMENTA: Investigation - Investigação
     */
    async documentInvestigation(step, executionResult, testResult, docResult) {
        this.logger.info('🔍 Documentando investigação...');
        
        const investigationDoc = this.generateInvestigationReport(step, executionResult, testResult);
        const docPath = await this.saveDocument('investigation', `investigacao-etapa-${step.id}`, investigationDoc);
        
        docResult.filesCreated.push(docPath);
        docResult.sectionsUpdated.push('Relatório de Investigação');
        
        // Criar entrada no log de problemas
        await this.updateProblemLog(investigationDoc);
    }

    /**
     * DOCUMENTA: Fix - Correção
     */
    async documentFix(step, executionResult, testResult, docResult) {
        this.logger.info('🔧 Documentando correção...');
        
        const fixDoc = this.generateFixDocument(step, executionResult, testResult);
        const docPath = await this.saveDocument('fixes', `correcao-etapa-${step.id}`, fixDoc);
        
        docResult.filesCreated.push(docPath);
        docResult.sectionsUpdated.push('Correções Aplicadas');
        
        // Atualizar changelog
        await this.updateChangelog('fix', fixDoc.summary);
        
        // Atualizar problema como resolvido
        await this.markProblemAsResolved(step, fixDoc);
    }

    /**
     * DOCUMENTA: Refactor - Refatoração
     */
    async documentRefactor(step, executionResult, testResult, docResult) {
        this.logger.info('♻️ Documentando refatoração...');
        
        const refactorDoc = this.generateRefactorDocument(step, executionResult, testResult);
        const docPath = await this.saveDocument('refactoring', `refatoracao-etapa-${step.id}`, refactorDoc);
        
        docResult.filesCreated.push(docPath);
        docResult.sectionsUpdated.push('Refatorações');
        
        // Atualizar changelog
        await this.updateChangelog('refactor', refactorDoc.summary);
        
        // Documentar melhorias na arquitetura
        await this.updateArchitectureDoc(refactorDoc);
    }

    /**
     * DOCUMENTA: Testing - Testes
     */
    async documentTesting(step, executionResult, testResult, docResult) {
        this.logger.info('🧪 Documentando testes...');
        
        // 1. Documentar testes criados
        await this.documentTestSuites(executionResult, docResult);
        
        // 2. Gerar relatório de cobertura
        await this.generateCoverageReport(testResult, docResult);
        
        // 3. Criar guia de execução de testes
        await this.createTestingGuide(step, docResult);
        
        // 4. Atualizar documentação de QA
        await this.updateQADocumentation(testResult, docResult);
    }

    /**
     * DOCUMENTA: Documentation - Documentação
     */
    async documentDocumentation(step, executionResult, testResult, docResult) {
        this.logger.info('📚 Documentando documentação (meta!)...');
        
        const metaDoc = {
            title: 'Documentação Criada',
            content: `# Documentação Criada - Etapa ${step.id}

## Arquivos de Documentação Criados
${executionResult.filesCreated.map(f => `- ${path.basename(f)}`).join('\n')}

## Seções Atualizadas
${executionResult.filesModified.map(f => `- ${path.basename(f)}`).join('\n')}

## Resumo
${executionResult.output}

## Timestamp
${new Date().toISOString()}
            `
        };
        
        const docPath = await this.saveDocument('meta', `documentacao-etapa-${step.id}`, metaDoc);
        docResult.filesCreated.push(docPath);
    }

    /**
     * DOCUMENTA: Validation - Validação
     */
    async documentValidation(step, executionResult, testResult, docResult) {
        this.logger.info('✅ Documentando validação...');
        
        const validationDoc = this.generateValidationReport(step, executionResult, testResult);
        const docPath = await this.saveDocument('validation', `validacao-etapa-${step.id}`, validationDoc);
        
        docResult.filesCreated.push(docPath);
        docResult.sectionsUpdated.push('Relatório de Validação');
        
        // Criar resumo executivo se foi a validação final
        if (step.id === executionResult.totalSteps) {
            await this.generateExecutiveSummary(validationDoc, docResult);
        }
    }

    /**
     * DOCUMENTA: General - Documentação geral
     */
    async documentGeneral(step, executionResult, testResult, docResult) {
        this.logger.info('⚙️ Documentando execução geral...');
        
        const generalDoc = {
            title: `Execução Geral - Etapa ${step.id}`,
            content: this.generateGeneralDocContent(step, executionResult, testResult)
        };
        
        const docPath = await this.saveDocument('general', `execucao-etapa-${step.id}`, generalDoc);
        docResult.filesCreated.push(docPath);
    }

    // ===== GERADORES DE CONTEÚDO =====

    generateAnalysisDocument(step, executionResult, testResult) {
        return {
            title: `Análise - Etapa ${step.id}`,
            summary: `Análise de requisitos e preparação para ${step.title}`,
            content: `# Análise - Etapa ${step.id}: ${step.title}

## 📋 Resumo da Análise
${step.description}

## 🎯 Requisitos Identificados
${this.formatDeliverables(executionResult.deliverables?.requirements)}

## 📦 Dependências Verificadas
${this.formatDeliverables(executionResult.deliverables?.dependencyCheck)}

## 📁 Estrutura de Arquivos
${this.formatDeliverables(executionResult.deliverables?.fileStructure)}

## ⏱️ Tempo de Execução
- **Duração**: ${executionResult.duration}s
- **Tempo Estimado**: ${step.estimatedTime}

## ✅ Testes Realizados
### Sucessos (${testResult.passed.length})
${testResult.passed.map(test => `- ✅ ${test}`).join('\n')}

### Avisos (${testResult.warnings.length})
${testResult.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}

### Erros (${testResult.errors.length})
${testResult.errors.map(error => `- ❌ ${error}`).join('\n')}

## 📊 Resultado
- **Status**: ${testResult.hasErrors ? '❌ Com Erros' : '✅ Sucesso'}
- **Pode Prosseguir**: ${testResult.canProceed ? 'Sim' : 'Não'}

---
*Documentado automaticamente em ${new Date().toISOString()}*
            `
        };
    }

    generateInvestigationReport(step, executionResult, testResult) {
        return {
            title: `Investigação - Etapa ${step.id}`,
            summary: `Investigação de problemas para ${step.title}`,
            content: `# Relatório de Investigação - Etapa ${step.id}

## 🔍 Problema Investigado
${step.description}

## 📊 Análise de Erros
${this.formatDeliverables(executionResult.deliverables?.errorAnalysis)}

## 🔄 Reprodução do Problema
${this.formatDeliverables(executionResult.deliverables?.reproduction)}

## 🎯 Causa Raiz Identificada
${this.formatDeliverables(executionResult.deliverables?.rootCause)}

## 🔧 Recomendações
${this.generateRecommendations(executionResult.deliverables?.rootCause)}

## 📈 Impacto
- **Severidade**: ${this.assessSeverity(testResult)}
- **Urgência**: ${this.assessUrgency(step)}

---
*Investigação concluída em ${new Date().toISOString()}*
            `
        };
    }

    generateFixDocument(step, executionResult, testResult) {
        return {
            title: `Correção - Etapa ${step.id}`,
            summary: `Correções aplicadas para ${step.title}`,
            content: `# Correção Aplicada - Etapa ${step.id}

## 🔧 Problema Corrigido
${step.description}

## 📋 Correções Aplicadas
${this.formatDeliverables(executionResult.deliverables?.appliedFixes)}

## 📁 Arquivos Modificados
${executionResult.filesModified.map(file => `- ${path.basename(file)}`).join('\n')}

## 💻 Comandos Executados
${executionResult.commandsExecuted.map(cmd => `\`${cmd}\``).join('\n')}

## ✅ Verificação da Correção
### Testes Passaram (${testResult.passed.length})
${testResult.passed.map(test => `- ✅ ${test}`).join('\n')}

### Resultados
- **Problema Resolvido**: ${testResult.hasErrors ? 'Não' : 'Sim'}
- **Regressões**: ${testResult.warnings.filter(w => w.includes('regressão')).length}

## 🎯 Próximos Passos
${this.generateNextSteps(testResult)}

---
*Correção documentada em ${new Date().toISOString()}*
            `
        };
    }

    generateRefactorDocument(step, executionResult, testResult) {
        return {
            title: `Refatoração - Etapa ${step.id}`,
            summary: `Refatoração realizada para ${step.title}`,
            content: `# Refatoração - Etapa ${step.id}

## ♻️ Objetivo da Refatoração
${step.description}

## 📊 Análise de Qualidade Anterior
${this.formatDeliverables(executionResult.deliverables?.codeAnalysis)}

## 🔧 Refatorações Aplicadas
${this.formatDeliverables(executionResult.deliverables?.refactorPlan)}

## 📁 Arquivos Afetados
${executionResult.filesModified.map(file => `- ${path.basename(file)}`).join('\n')}

## 📈 Melhorias Obtidas
${this.generateImprovements(testResult)}

## ✅ Testes de Regressão
- **Todos os testes passaram**: ${testResult.hasErrors ? 'Não' : 'Sim'}
- **Funcionalidade preservada**: ${this.checkFunctionalityPreserved(testResult)}

---
*Refatoração documentada em ${new Date().toISOString()}*
            `
        };
    }

    generateValidationReport(step, executionResult, testResult) {
        return {
            title: `Validação Final - Etapa ${step.id}`,
            summary: `Relatório de validação completa`,
            content: `# Relatório de Validação Final

## ✅ Resumo da Validação
${step.description}

## 📊 Resultados Gerais
${this.formatDeliverables(executionResult.deliverables?.validation)}

## 🧪 Testes Finais
${this.formatDeliverables(executionResult.deliverables?.finalTests)}

## 📈 Verificação de Qualidade
${this.formatDeliverables(executionResult.deliverables?.qualityCheck)}

## 🎯 Status Final
- **Validação Aprovada**: ${testResult.hasErrors ? 'Não' : 'Sim'}
- **Pronto para Produção**: ${this.assessProductionReadiness(testResult)}
- **Score de Qualidade**: ${executionResult.deliverables?.qualityCheck?.score || 'N/A'}

## 📋 Resumo Executivo
${this.generateExecutiveSummaryContent(executionResult, testResult)}

---
*Validação concluída em ${new Date().toISOString()}*
            `
        };
    }

    // ===== FUNÇÕES DE DOCUMENTAÇÃO ESPECÍFICAS =====

    async documentCodeChanges(executionResult, docResult) {
        if (executionResult.filesCreated.length === 0 && executionResult.filesModified.length === 0) {
            return;
        }

        const codeDoc = {
            title: 'Mudanças no Código',
            content: `# Mudanças no Código

## 📁 Arquivos Criados (${executionResult.filesCreated.length})
${executionResult.filesCreated.map(file => `- \`${path.basename(file)}\``).join('\n')}

## ✏️ Arquivos Modificados (${executionResult.filesModified.length})
${executionResult.filesModified.map(file => `- \`${path.basename(file)}\``).join('\n')}

## 💻 Comandos Executados
${executionResult.commandsExecuted.map(cmd => `\`${cmd}\``).join('\n')}

---
*Gerado automaticamente*
            `
        };

        const docPath = await this.saveDocument('code', 'mudancas-codigo', codeDoc);
        docResult.filesCreated.push(docPath);
    }

    async generateAPIDocumentation(executionResult, docResult) {
        // Verificar se há APIs para documentar
        const apiFiles = executionResult.filesCreated.filter(f => 
            f.includes('api') || f.includes('controller') || f.includes('route')
        );

        if (apiFiles.length === 0) return;

        const apiDoc = {
            title: 'Documentação da API',
            content: `# Documentação da API

## 🔗 Endpoints Criados/Modificados
${apiFiles.map(file => `- \`${path.basename(file)}\``).join('\n')}

## 📋 Como Usar
1. Inicie o servidor
2. Acesse os endpoints documentados
3. Verifique as respostas

---
*API documentada automaticamente*
            `
        };

        const docPath = await this.saveDocument('api', 'documentacao-api', apiDoc);
        docResult.filesCreated.push(docPath);
    }

    async createUsageGuides(step, executionResult, docResult) {
        const usageDoc = {
            title: 'Guia de Uso',
            content: `# Guia de Uso - ${step.title}

## 🚀 Como Começar
1. Verifique os pré-requisitos
2. Execute os comandos de instalação
3. Configure o ambiente
4. Execute o projeto

## 📋 Comandos Importantes
${executionResult.commandsExecuted.map(cmd => `\`${cmd}\``).join('\n')}

## 🔧 Configuração
Consulte os arquivos de configuração criados.

---
*Guia gerado automaticamente*
            `
        };

        const docPath = await this.saveDocument('guides', 'guia-uso', usageDoc);
        docResult.filesCreated.push(docPath);
    }

    async documentTechnicalDecisions(step, executionResult, docResult) {
        const decisionsDoc = {
            title: 'Decisões Técnicas',
            content: `# Decisões Técnicas - ${step.title}

## 🎯 Contexto
${step.description}

## 🔧 Abordagem Escolhida
${step.language} foi utilizado como linguagem principal.

## 📊 Justificativa
- Adequação ao projeto existente
- Facilidade de manutenção
- Performance adequada

## ⚠️ Considerações
${executionResult.output.includes('warning') ? 'Alguns avisos foram gerados durante a implementação.' : 'Implementação sem avisos significativos.'}

---
*Decisões documentadas automaticamente*
            `
        };

        const docPath = await this.saveDocument('decisions', 'decisoes-tecnicas', decisionsDoc);
        docResult.filesCreated.push(docPath);
    }

    // ===== FUNÇÕES DE ATUALIZAÇÃO =====

    /**
     * AUXILIAR: Atualizar índice de documentação
     */
    async updateDocumentationIndex(documentationResult) {
        const indexPath = path.join(process.cwd(), 'docs', 'INDEX.md');
        
        let indexContent = '';
        if (await fs.pathExists(indexPath)) {
            indexContent = await fs.readFile(indexPath, 'utf-8');
        } else {
            indexContent = `# Índice de Documentação

Esta é a documentação gerada automaticamente pelo sistema MCP.

## Documentos por Etapa

`;
        }

        // Adicionar nova entrada
        const newEntry = `- [${documentationResult.stepTitle}](${path.relative(path.dirname(indexPath), documentationResult.filesCreated[0])}) - ${documentationResult.timestamp}\n`;
        
        if (!indexContent.includes(documentationResult.stepId)) {
            indexContent += newEntry;
            await fs.writeFile(indexPath, indexContent);
        }
    }

    /**
     * AUXILIAR: Atualizar README principal
     */
    async updateMainReadme(step, documentationResult) {
        const readmePath = path.join(process.cwd(), 'README.md');
        
        if (await fs.pathExists(readmePath)) {
            let readmeContent = await fs.readFile(readmePath, 'utf-8');
            
            // Adicionar seção de log de mudanças se não existir
            if (!readmeContent.includes('## Changelog')) {
                readmeContent += '\n\n## Changelog\n\n';
            }

            // Adicionar entrada do changelog
            const changelogEntry = `### ${new Date().toLocaleDateString()} - ${step.title}\n- ${step.description}\n\n`;
            readmeContent = readmeContent.replace(
                '## Changelog\n\n',
                `## Changelog\n\n${changelogEntry}`
            );

            await fs.writeFile(readmePath, readmeContent);
        }
    }

    /**
     * AUXILIAR: Atualizar seção específica do README
     */
    async updateReadmeSection(sectionName, content) {
        const readmePath = path.join(process.cwd(), 'README.md');
        
        if (await fs.pathExists(readmePath)) {
            let readmeContent = await fs.readFile(readmePath, 'utf-8');
            
            const sectionPattern = new RegExp(`## ${sectionName}[\\s\\S]*?(?=## |$)`, 'i');
            const newSection = `## ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}\n\n${content}\n\n`;
            
            if (sectionPattern.test(readmeContent)) {
                readmeContent = readmeContent.replace(sectionPattern, newSection);
            } else {
                readmeContent += newSection;
            }
            
            await fs.writeFile(readmePath, readmeContent);
        }
    }

    /**
     * AUXILIAR: Gerar conteúdo de documentação geral
     */
    generateGeneralDocContent(step, executionResult, testResult) {
        return `# Execução Geral - Etapa ${step.id}

## 📋 Descrição
${step.description}

## ⚙️ Tipo de Execução
${step.type}

## 📊 Resultados da Execução
### Arquivos Afetados
${executionResult.filesCreated.length > 0 ? 
    `#### Criados:\n${executionResult.filesCreated.map(f => `- ${path.basename(f)}`).join('\n')}` : 
    'Nenhum arquivo criado'
}

${executionResult.filesModified.length > 0 ? 
    `#### Modificados:\n${executionResult.filesModified.map(f => `- ${path.basename(f)}`).join('\n')}` : 
    'Nenhum arquivo modificado'
}

### Comandos Executados
${executionResult.commandsExecuted.length > 0 ? 
    executionResult.commandsExecuted.map(cmd => `\`${cmd}\``).join('\n') : 
    'Nenhum comando executado'
}

## 🧪 Resultado dos Testes
- **Sucessos**: ${testResult.passed.length}
- **Falhas**: ${testResult.failed.length}
- **Avisos**: ${testResult.warnings.length}
- **Erros**: ${testResult.errors.length}

## 📈 Métricas
- **Duração**: ${executionResult.duration}s
- **Status**: ${executionResult.success ? '✅ Sucesso' : '❌ Falha'}

## 📝 Log de Saída
\`\`\`
${executionResult.output}
\`\`\`

---
*Documentado em ${new Date().toISOString()}*
`;
    }

    /**
     * UTILIDADE: Exportar documentação completa
     */
    async exportCompleteDocumentation(format = 'markdown') {
        const exportDir = path.join(process.cwd(), 'exports', `documentation-${Date.now()}`);
        await fs.ensureDir(exportDir);

        // Copiar todos os documentos
        const docsDir = path.join(process.cwd(), 'docs');
        if (await fs.pathExists(docsDir)) {
            await fs.copy(docsDir, exportDir);
        }

        // Gerar índice consolidado
        const consolidatedIndex = await this.generateConsolidatedIndex();
        await fs.writeFile(path.join(exportDir, 'CONSOLIDATED_INDEX.md'), consolidatedIndex);

        this.logger.success(`📦 Documentação exportada para: ${exportDir}`);
        return exportDir;
    }

    /**
     * AUXILIAR: Gerar índice consolidado
     */
    async generateConsolidatedIndex() {
        const steps = this.documentationHistory.map(doc => ({
            id: doc.stepId,
            title: doc.stepTitle,
            type: doc.documentationType,
            timestamp: doc.timestamp,
            files: doc.filesCreated
        }));

        return `# Documentação Consolidada

## Resumo do Projeto
Documentação gerada automaticamente pelo sistema MCP Orquestrador.

## Execução das Etapas

${steps.map(step => `### Etapa ${step.id}: ${step.title}
- **Tipo**: ${step.type}
- **Timestamp**: ${step.timestamp}
- **Documentos**: ${step.files.length}
  ${step.files.map(file => `  - ${path.basename(file)}`).join('\n')}
`).join('\n')}

## Estatísticas
- **Total de Etapas**: ${steps.length}
- **Total de Documentos**: ${steps.reduce((acc, step) => acc + step.files.length, 0)}
- **Período**: ${steps[0]?.timestamp} - ${steps[steps.length - 1]?.timestamp}

---
*Consolidado em ${new Date().toISOString()}*
`;
    }

    /**
     * UTILIDADE: Obter histórico de documentação
     */
    getDocumentationHistory() {
        return this.documentationHistory;
    }

    /**
     * UTILIDADE: Obter estatísticas de documentação
     */
    getDocumentationStats() {
        const totalDocs = this.documentationHistory.reduce((acc, doc) => acc + doc.filesCreated.length, 0);
        const typeDistribution = {};

        this.documentationHistory.forEach(doc => {
            typeDistribution[doc.documentationType] = (typeDistribution[doc.documentationType] || 0) + 1;
        });

        return {
            totalSteps: this.documentationHistory.length,
            totalDocuments: totalDocs,
            averageDocsPerStep: totalDocs / (this.documentationHistory.length || 1),
            typeDistribution,
            firstStep: this.documentationHistory[0]?.timestamp,
            lastStep: this.documentationHistory[this.documentationHistory.length - 1]?.timestamp
        };
    }

    /**
     * UTILIDADE: Limpar histórico de documentação
     */
    clearDocumentationHistory() {
        this.documentationHistory = [];
        this.logger.info('🗑️ Histórico de documentação limpo');
    }

    /**
     * UTILIDADE: Buscar documentação por etapa
     */
    findDocumentationByStep(stepId) {
        return this.documentationHistory.find(doc => doc.stepId === stepId);
    }

    /**
     * UTILIDADE: Buscar documentação por tipo
     */
    findDocumentationByType(type) {
        return this.documentationHistory.filter(doc => doc.documentationType === type);
    }
}
