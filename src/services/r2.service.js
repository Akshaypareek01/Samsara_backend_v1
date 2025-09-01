import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { r2Client, R2_BUCKET } from '../config/r2.config.js';

class R2Service {
  /**
   * Upload a file to R2 storage
   * @param {Buffer} fileBuffer - The file buffer to upload
   * @param {string} originalFilename - Original filename
   * @param {string} mimeType - File mime type
   * @returns {Promise<{url: string, fileName: string}>}
   */
  static async uploadFile(fileBuffer, originalFilename, mimeType) {
    const fileExtension = originalFilename.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    await r2Client.send(command);

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return {
      url: fileUrl,
      fileName,
    };
  }
}

export default R2Service;
