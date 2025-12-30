import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { r2Client, R2_BUCKET } from '../config/r2.config.js';
import logger from '../config/logger.js';

class R2Service {
  /**
   * Upload a file to R2 storage
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} originalFilename - Original filename
   * @param {string} mimeType - File mime type
   * @returns {Promise<{url: string, fileName: string}>}
   */
  static async uploadFile(fileBuffer, originalFilename, mimeType) {
    if (!R2_BUCKET) {
      throw new Error('R2 bucket is not configured');
    }

    const fileExtension = originalFilename.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    try {
      await r2Client.send(command);

      const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

      return {
        url: fileUrl,
        fileName,
      };
    } catch (error) {
      logger.error('R2 upload error:', {
        message: error.message,
        statusCode: error.$metadata?.httpStatusCode,
        bucket: R2_BUCKET,
      });

      // Provide more helpful error messages
      if (error.$metadata?.httpStatusCode === 403) {
        throw new Error('R2 access denied - check credentials and bucket permissions');
      } else if (error.$metadata?.httpStatusCode === 404) {
        throw new Error('R2 bucket not found - check bucket name');
      } else if (error.message.includes('timeout') || error.message.includes('ECONNRESET')) {
        throw new Error('R2 connection timeout - check network connectivity and endpoint');
      } else {
        throw new Error(`R2 upload failed: ${error.message}`);
      }
    }
  }
}

export default R2Service;
