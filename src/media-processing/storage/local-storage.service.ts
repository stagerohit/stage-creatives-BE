import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from './storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'images');
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3001';

  constructor() {
    this.ensureUploadDirectory();
  }

  async upload(file: Buffer, filename: string, contentType: string): Promise<string> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      
      this.logger.log(`Uploading file to: ${filePath}`);
      
      await fs.writeFile(filePath, file);
      
      const fileUrl = this.getUrl(filename);
      this.logger.log(`File uploaded successfully: ${fileUrl}`);
      
      return fileUrl;
    } catch (error) {
      this.logger.error(`Error uploading file ${filename}:`, error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  async delete(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      
      this.logger.log(`Deleting file: ${filePath}`);
      
      await fs.unlink(filePath);
      
      this.logger.log(`File deleted successfully: ${filename}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${filename}:`, error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  getUrl(filename: string): string {
    return `/uploads/images/${filename}`;
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch {
      this.logger.log(`Creating upload directory: ${this.uploadPath}`);
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }
} 