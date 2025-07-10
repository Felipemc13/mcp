#!/bin/bash

# Script de Instalação do Sistema MCP Orquestrador
# Versão: 1.0.0
# Data: $(date)

echo "🚀 Instalando Sistema MCP Orquestrador..."

# Criar diretório do projeto
PROJECT_NAME="mcp-orchestrator-system"
read -p "Digite o nome do projeto (default: $PROJECT_NAME): " input_name
PROJECT_NAME=${input_name:-$PROJECT_NAME}

echo "📁 Criando projeto: $PROJECT_NAME"
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Criar estrutura de diretórios
echo "📂 Criando estrutura de diretórios..."
mkdir -p src/utils
mkdir -p docs
mkdir -p logs
mkdir -p temp
mkdir -p backups

# Criar package.json
echo "📦 Criando package.json..."
cat > package.json << 'EOL'
{
  "name": "mcp-orchestrator-system",
  "version": "1.0.0",
  "description": "Sistema MCP com orquestração automática e controle rigoroso",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js start",
    "analyze": "node index.js analyze",
    "validate": "node index.js validate",
    "setup": "node index.js setup",
    "clean": "node index.js clean",
    "status": "node index.js status",
    "test": "echo \"No tests specified yet\" && exit 0"
  },
  "keywords": [
    "mcp",
    "orchestrator",
    "automation",
    "ai",
    "workflow"
  ],
  "author": "MCP System",
  "license": "MIT",
  "dependencies": {
    "chalk": "^5.3.0",
    "commander": "^11.1.0",
    "inquirer": "^9.2.12",
    "fs-extra": "^11.1.1",
    "glob": "^10.3.10",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOL

# Criar .env.example
echo "⚙️ Criando configurações..."
cat > .env.example << 'EOL'
# Configurações do Sistema MCP Orquestrador

# Nível de log (debug, info, warn, error)
LOG_LEVEL=info

# Timeout padrão para execução de etapas (ms)
DEFAULT_TIMEOUT=300000

# Diretório para logs
LOG_DIR=./logs

# Diretório para documentação
DOCS_DIR=./docs

# Diretório para backups
BACKUP_DIR=./backups

# Número máximo de tentativas de retry
MAX_RETRIES=3

# Ativar modo verboso
VERBOSE=true

# Ativar auto-fix automático
AUTO_FIX_ENABLED=true

# Score mínimo para aprovação de etapas
MIN_APPROVAL_SCORE=70

# Timeout para testes (ms)
TEST_TIMEOUT=60000
EOL

# Criar README.md
echo "📚 Criando documentação..."
cat > README.md << 'EOL'
# 🚀 Sistema MCP Orquestrador

Sistema completo de automação de tarefas com controle rigoroso de qualidade.

## 🎯 O que é o MCP Orquestrador?

O MCP (Model Context Protocol) Orquestrador é um sistema avançado que:

- 📖 **Lê e entende** todo o codebase do projeto
- 🧠 **Divide tarefas complexas** em etapas específicas e executáveis
- ⚙️ **Executa rigorosamente** cada etapa com validação completa
- 🧪 **Testa automaticamente** cada resultado
- 📚 **Documenta automaticamente** todo o processo
- ✅ **Valida rigorosamente** antes de avançar
- 🔧 **Corrige automaticamente** problemas encontrados

## 🏗️ Arquitetura

```
Orquestrador Principal
    ↓
MCP-1 (Analyzer/Executor) → MCP-2 (Tester) → MCP-3 (Documentor) → MCP-4 (Validator)
    ↑                                                                      ↓
    ← ← ← ← ← ← ← ← ← ← ← (loop até 100% aprovado) ← ← ← ← ← ← ← ← ← ← ← ←
```

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env

# Configurar sistema
npm run setup
```

## 📖 Uso

### Modo Interativo
```bash
npm start
```

### Análise de Codebase
```bash
npm run analyze
```

### Validação do Sistema
```bash
npm run validate
```

### Status do Sistema
```bash
npm run status
```

## 🎮 Comandos CLI

```bash
# Iniciar com tarefa específica
node index.js start --task "Criar uma API REST completa"

# Análise apenas
node index.js analyze --path ./src

# Limpeza de arquivos
node index.js clean --logs --temp

# Configuração inicial
node index.js setup
```

## 🔧 Configuração

Edite o arquivo `.env` para personalizar:

- Timeouts de execução
- Níveis de log
- Diretórios de trabalho
- Scores mínimos de aprovação
- Configurações de auto-fix

## 📊 Funcionalidades

### ✅ Análise Inteligente
- Detecção automática de linguagens e frameworks
- Análise de dependências e estrutura do projeto
- Identificação de padrões e arquitetura

### ⚙️ Execução Rigorosa
- Divisão de tarefas em etapas específicas
- Execução controlada com validação em cada passo
- Sistema de retry e auto-correção

### 🧪 Testes Automáticos
- Verificação de sintaxe
- Testes de funcionalidade
- Verificação de performance
- Testes de regressão

### 📚 Documentação Automática
- Documentação de cada etapa
- Atualização automática de README
- Geração de relatórios detalhados
- Histórico completo de execução

### ✅ Validação Rigorosa
- Critérios específicos por tipo de tarefa
- Scores de qualidade e completude
- Aprovação baseada em métricas
- Relatórios de validação detalhados

## 📈 Exemplos de Uso

### Criar uma API
```bash
npm start
# Tarefa: "Criar uma API REST para gerenciar usuários com CRUD completo"
```

### Corrigir um Bug
```bash
npm start
# Tarefa: "Corrigir o erro de autenticação na rota /login"
```

### Refatorar Código
```bash
npm start
# Tarefa: "Refatorar o módulo de validação para usar Joi"
```

### Implementar Testes
```bash
npm start
# Tarefa: "Implementar testes unitários para o service UserService"
```

## 🔄 Fluxo de Execução

1. **Análise**: Entende o projeto e divide a tarefa
2. **Execução**: Implementa cada etapa
3. **Teste**: Verifica se está funcionando
4. **Documentação**: Documenta o que foi feito
5. **Validação**: Aprova ou rejeita o resultado
6. **Loop**: Repete até tudo estar 100% correto

## 📋 Status do Sistema

Use `npm run status` para ver:
- Versão do Node.js
- Estado dos logs
- Documentação gerada
- Último status de execução

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs em `./logs/`
2. Execute `npm run validate` para verificar integridade
3. Use `npm run clean` para limpar arquivos temporários

---

**Sistema MCP Orquestrador - Automação Inteligente com Controle Total** 🚀
EOL

echo "✅ Estrutura básica criada!"
echo ""
echo "📥 Para baixar o sistema completo, você precisa copiar os arquivos:"
echo ""
echo "1. index.js (CLI principal)"
echo "2. src/orchestrator.js (Orquestrador)"
echo "3. src/mcp-1-analysis.js (Analisador/Executor)"
echo "4. src/mcp-2-tester.js (Testador)"
echo "5. src/mcp-3-documentor.js (Documentador)"
echo "6. src/mcp-4-validator.js (Validador)"
echo "7. src/utils/logger.js (Logger)"
echo "8. src/utils/file-manager.js (Gerenciador de Arquivos)"
echo "9. src/utils/error-handler.js (Tratador de Erros)"
echo ""
echo "📂 Projeto criado em: $(pwd)"
echo ""
echo "🚀 Próximos passos:"
echo "1. cd $PROJECT_NAME"
echo "2. npm install"
echo "3. Copiar os arquivos do sistema MCP"
echo "4. npm run setup"
echo "5. npm start"
echo ""
echo "✨ Sistema MCP Orquestrador pronto para uso!"
