export interface StorageService {
  /**
   * Upload a file and return the URL
   * @param file - File buffer
   * @param filename - Target filename
   * @param contentType - MIME type of the file
   * @returns Promise<string> - URL of the uploaded file
   */
  upload(file: Buffer, filename: string, contentType: string): Promise<string>;

  /**
   * Delete a file
   * @param filename - Name of the file to delete
   * @returns Promise<void>
   */
  delete(filename: string): Promise<void>;

  /**
   * Get URL for a file
   * @param filename - Name of the file
   * @returns string - URL of the file
   */
  getUrl(filename: string): string;

  /**
   * Check if a file exists
   * @param filename - Name of the file
   * @returns Promise<boolean>
   */
  exists(filename: string): Promise<boolean>;
} 