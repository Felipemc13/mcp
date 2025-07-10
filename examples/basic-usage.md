# Exemplos de Uso do Sistema MCP

## 🚀 Uso Básico

### 1. Criar uma API REST
```bash
npm start
# Tarefa: "Criar uma API REST completa para gerenciar usuários com CRUD"
```

### 2. Corrigir um Bug
```bash
npm start
# Tarefa: "Investigar e corrigir o erro 500 na rota /api/users"
```

### 3. Implementar Testes
```bash
npm start
# Tarefa: "Criar testes unitários para o módulo de autenticação"
```

### 4. Refatorar Código
```bash
npm start
# Tarefa: "Refatorar o controller UserController para usar async/await"
```

## 📋 Exemplos de Tarefas Complexas

### Projeto Completo
```bash
npm start
# Tarefa: "Criar um sistema de blog completo com:
# - API REST com Node.js e Express
# - Banco de dados MongoDB
# - Autenticação JWT
# - CRUD de posts e usuários
# - Validação de dados
# - Testes unitários
# - Documentação da API"
```

### Migração de Tecnologia
```bash
npm start
# Tarefa: "Migrar o projeto de JavaScript para TypeScript mantendo toda funcionalidade"
```

### Otimização de Performance
```bash
npm start
# Tarefa: "Otimizar performance da aplicação:
# - Implementar cache Redis
# - Otimizar queries do banco
# - Adicionar compressão gzip
# - Implementar lazy loading"
```

## ⚙️ Configurações Avançadas

### Análise Apenas
```bash
# Analisar projeto sem executar tarefas
npm run analyze

# Analisar diretório específico
node index.js analyze --path ./src --depth 3
```

### Validação e Status
```bash
# Verificar integridade do sistema
npm run validate

# Ver status detalhado
npm run status

# Limpar arquivos temporários
npm run clean --all
```

### Modo Debug
```bash
# Executar com logs detalhados
DEBUG=true npm start

# Executar com timeout customizado
TIMEOUT=600000 npm start
```

## 🔧 Configuração via .env

```bash
# Copiar configurações exemplo
cp .env.example .env

# Editar configurações
# LOG_LEVEL=debug
# AUTO_FIX_ENABLED=true
# MIN_APPROVAL_SCORE=80
```

## 📊 Monitoramento

### Logs Detalhados
```bash
# Ver logs em tempo real
tail -f logs/system.log

# Ver logs por categoria
grep "MCP-1" logs/system.log
grep "ERROR" logs/system.log
```

### Relatórios
```bash
# Verificar documentação gerada
ls docs/

# Ver relatórios de validação
ls logs/validation-reports/

# Ver relatórios de testes
ls logs/test-reports/
```
