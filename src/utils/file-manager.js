import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class FileManager {
    constructor() {
        this.operations = [];
    }

    /**
     * Criar arquivo com conteúdo
     */
    async createFile(filePath, content = '') {
        try {
            await fs.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, content);
            
            this.operations.push({
                type: 'create',
                path: filePath,
                timestamp: new Date().toISOString(),
                success: true
            });

            return true;
        } catch (error) {
            this.operations.push({
                type: 'create',
                path: filePath,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Ler arquivo
     */
    async readFile(filePath, encoding = 'utf8') {
        try {
            const content = await fs.readFile(filePath, encoding);
            
            this.operations.push({
                type: 'read',
                path: filePath,
                timestamp: new Date().toISOString(),
                success: true,
                size: content.length
            });

            return content;
        } catch (error) {
            this.operations.push({
                type: 'read',
                path: filePath,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Atualizar arquivo
     */
    async updateFile(filePath, content) {
        try {
            const exists = await fs.pathExists(filePath);
            if (!exists) {
                throw new Error(`Arquivo não encontrado: ${filePath}`);
            }

            await fs.writeFile(filePath, content);
            
            this.operations.push({
                type: 'update',
                path: filePath,
                timestamp: new Date().toISOString(),
                success: true
            });

            return true;
        } catch (error) {
            this.operations.push({
                type: 'update',
                path: filePath,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Deletar arquivo
     */
    async deleteFile(filePath) {
        try {
            await fs.remove(filePath);
            
            this.operations.push({
                type: 'delete',
                path: filePath,
                timestamp: new Date().toISOString(),
                success: true
            });

            return true;
        } catch (error) {
            this.operations.push({
                type: 'delete',
                path: filePath,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Copiar arquivo
     */
    async copyFile(sourcePath, destPath) {
        try {
            await fs.ensureDir(path.dirname(destPath));
            await fs.copy(sourcePath, destPath);
            
            this.operations.push({
                type: 'copy',
                path: `${sourcePath} -> ${destPath}`,
                timestamp: new Date().toISOString(),
                success: true
            });

            return true;
        } catch (error) {
            this.operations.push({
                type: 'copy',
                path: `${sourcePath} -> ${destPath}`,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Mover arquivo
     */
    async moveFile(sourcePath, destPath) {
        try {
            await fs.ensureDir(path.dirname(destPath));
            await fs.move(sourcePath, destPath);
            
            this.operations.push({
                type: 'move',
                path: `${sourcePath} -> ${destPath}`,
                timestamp: new Date().toISOString(),
                success: true
            });

            return true;
        } catch (error) {
            this.operations.push({
                type: 'move',
                path: `${sourcePath} -> ${destPath}`,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Verificar se arquivo existe
     */
    async exists(filePath) {
        try {
            return await fs.pathExists(filePath);
        } catch {
            return false;
        }
    }

    /**
     * Obter informações do arquivo
     */
    async getFileInfo(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile()
            };
        } catch (error) {
            throw new Error(`Erro ao obter informações do arquivo: ${error.message}`);
        }
    }

    /**
     * Listar arquivos em diretório
     */
    async listFiles(dirPath, pattern = '*') {
        try {
            const files = await glob(pattern, {
                cwd: dirPath,
                absolute: true
            });
            
            return files;
        } catch (error) {
            throw new Error(`Erro ao listar arquivos: ${error.message}`);
        }
    }

    /**
     * Criar diretório
     */
    async createDirectory(dirPath) {
        try {
            await fs.ensureDir(dirPath);
            
            this.operations.push({
                type: 'mkdir',
                path: dirPath,
                timestamp: new Date().toISOString(),
                success: true
            });

            return true;
        } catch (error) {
            this.operations.push({
                type: 'mkdir',
                path: dirPath,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Buscar arquivos por conteúdo
     */
    async searchInFiles(dirPath, searchText, filePattern = '**/*.{js,ts,json,md}') {
        try {
            const files = await glob(filePattern, {
                cwd: dirPath,
                absolute: true
            });

            const results = [];

            for (const file of files) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    if (content.includes(searchText)) {
                        const lines = content.split('\n');
                        const matches = [];

                        lines.forEach((line, index) => {
                            if (line.includes(searchText)) {
                                matches.push({
                                    line: index + 1,
                                    content: line.trim()
                                });
                            }
                        });

                        results.push({
                            file: file,
                            matches: matches
                        });
                    }
                } catch {
                    // Ignorar arquivos que não podem ser lidos
                    continue;
                }
            }

            return results;
        } catch (error) {
            throw new Error(`Erro na busca: ${error.message}`);
        }
    }

    /**
     * Backup de arquivo
     */
    async backupFile(filePath) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `${filePath}.backup.${timestamp}`;
            
            await this.copyFile(filePath, backupPath);
            
            return backupPath;
        } catch (error) {
            throw new Error(`Erro ao criar backup: ${error.message}`);
        }
    }

    /**
     * Obter tamanho de diretório
     */
    async getDirectorySize(dirPath) {
        try {
            const files = await glob('**/*', {
                cwd: dirPath,
                absolute: true,
                nodir: true
            });

            let totalSize = 0;
            for (const file of files) {
                try {
                    const stats = await fs.stat(file);
                    totalSize += stats.size;
                } catch {
                    // Ignorar arquivos que não podem ser acessados
                    continue;
                }
            }

            return {
                files: files.length,
                totalSize: totalSize,
                humanSize: this.formatBytes(totalSize)
            };
        } catch (error) {
            throw new Error(`Erro ao calcular tamanho: ${error.message}`);
        }
    }

    /**
     * Formatar bytes para leitura humana
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Obter histórico de operações
     */
    getOperationHistory() {
        return this.operations;
    }

    /**
     * Limpar histórico
     */
    clearHistory() {
        this.operations = [];
    }

    /**
     * Obter estatísticas de operações
     */
    getOperationStats() {
        const stats = {
            total: this.operations.length,
            successful: 0,
            failed: 0,
            byType: {}
        };

        this.operations.forEach(op => {
            if (op.success) {
                stats.successful++;
            } else {
                stats.failed++;
            }

            if (!stats.byType[op.type]) {
                stats.byType[op.type] = 0;
            }
            stats.byType[op.type]++;
        });

        return stats;
    }

    /**
     * Verificar integridade de arquivo (checksum simples)
     */
    async getFileChecksum(filePath) {
        try {
            const crypto = await import('crypto');
            const content = await fs.readFile(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            throw new Error(`Erro ao calcular checksum: ${error.message}`);
        }
    }

    /**
     * Comparar arquivos
     */
    async compareFiles(file1, file2) {
        try {
            const [content1, content2] = await Promise.all([
                fs.readFile(file1, 'utf8'),
                fs.readFile(file2, 'utf8')
            ]);

            return {
                identical: content1 === content2,
                size1: content1.length,
                size2: content2.length,
                lines1: content1.split('\n').length,
                lines2: content2.split('\n').length
            };
        } catch (error) {
            throw new Error(`Erro ao comparar arquivos: ${error.message}`);
        }
    }

    /**
     * Encontrar arquivos por padrão glob
     */
    async findFiles(pattern, options = {}) {
        try {
            const defaultOptions = {
                cwd: process.cwd(),
                ignore: ['node_modules/**', '.git/**', '**/.DS_Store'],
                ...options
            };
            
            const files = await glob(pattern, defaultOptions);
            
            this.operations.push({
                type: 'search',
                pattern,
                results: files.length,
                timestamp: new Date().toISOString()
            });
            
            return files;
        } catch (error) {
            throw new Error(`Erro ao buscar arquivos com padrão "${pattern}": ${error.message}`);
        }
    }

    /**
     * Encontrar arquivos por extensão
     */
    async findFilesByExtension(extension, directory = process.cwd()) {
        const pattern = path.join(directory, `**/*.${extension}`);
        return this.findFiles(pattern);
    }

    /**
     * Encontrar arquivos modificados recentemente
     */
    async findRecentFiles(directory = process.cwd(), hoursAgo = 24) {
        try {
            const cutoffTime = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));
            const allFiles = await this.findFiles('**/*', { cwd: directory });
            
            const recentFiles = [];
            for (const file of allFiles) {
                const filePath = path.join(directory, file);
                const stats = await fs.stat(filePath);
                if (stats.mtime > cutoffTime) {
                    recentFiles.push(file);
                }
            }
            
            return recentFiles;
        } catch (error) {
            throw new Error(`Erro ao buscar arquivos recentes: ${error.message}`);
        }
    }

    /**
     * Encontrar arquivos vazios
     */
    async findEmptyFiles(directory = process.cwd()) {
        try {
            const allFiles = await this.findFiles('**/*', { cwd: directory });
            const emptyFiles = [];
            
            for (const file of allFiles) {
                const filePath = path.join(directory, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile() && stats.size === 0) {
                    emptyFiles.push(file);
                }
            }
            
            return emptyFiles;
        } catch (error) {
            throw new Error(`Erro ao buscar arquivos vazios: ${error.message}`);
        }
    }
}
