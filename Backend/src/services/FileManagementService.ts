import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

class FileManagementService {
    private logFilePath: string;
    private readonly baseMediaPath: string;

    constructor() {
        this.baseMediaPath = path.join(process.cwd(), 'media');
        this.logFilePath = path.join(process.cwd(), 'logs/user-actions.log');
        this.ensureDirectories();
    }

    private async ensureDirectories() {
        await fsPromises.mkdir(this.baseMediaPath, { recursive: true });
        await fsPromises.mkdir(path.dirname(this.logFilePath), { recursive: true });
    }

    async createUserDirectory(userId: string): Promise<string> {
        const userDir = path.join(this.baseMediaPath, userId);
        await fsPromises.mkdir(userDir, { recursive: true });
        await this.logAction('CREATE_USER_DIRECTORY', `Created directory for user ${userId}`);
        return userDir;
    }

    async savePostImage(userId: string, postId: string, imageFile: Express.Multer.File): Promise<string> {
        const userDir = path.join(this.baseMediaPath, userId);
        await fsPromises.mkdir(userDir, { recursive: true });
        
        const fileExtension = path.extname(imageFile.originalname);
        const fileName = `${postId}${fileExtension}`;
        const filePath = path.join(userDir, fileName);
        
        await fsPromises.writeFile(filePath, imageFile.buffer);
        await this.logAction('SAVE_POST_IMAGE', `Saved image for post ${postId} by user ${userId}`);
        
        return fileName;
    }

    async deletePostImage(userId: string, fileName: string): Promise<void> {
        const filePath = path.join(this.baseMediaPath, userId, fileName);
        try {
            await fsPromises.unlink(filePath);
            await this.logAction('DELETE_POST_IMAGE', `Deleted image ${fileName} for user ${userId}`);
        } catch (error: any) {
            // Si el archivo no existe, lo ignoramos
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async deleteUserDirectory(userId: string): Promise<void> {
        const userDir = path.join(this.baseMediaPath, userId);
        try {
            await fsPromises.rm(userDir, { recursive: true, force: true });
            await this.logAction('DELETE_USER_DIRECTORY', `Deleted directory for user ${userId}`);
        } catch (error: any) {
            // Si el directorio no existe, lo ignoramos
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async logPostAction(userId: string, postId: string, action: string, details: string): Promise<void> {
        const userLogFile = path.join(this.baseMediaPath, userId, 'post-actions.log');
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${action} - Post ${postId}: ${details}\n`;
        
        await fsPromises.appendFile(userLogFile, logEntry);
        await this.logAction('LOG_POST_ACTION', `Logged ${action} for post ${postId} by user ${userId}`);
    }

    private async logAction(action: string, details: string): Promise<void> {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${action}: ${details}\n`;
        await fsPromises.appendFile(this.logFilePath, logEntry);
    }
}

export default new FileManagementService(); 