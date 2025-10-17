import dotenv from 'dotenv';
import { Request } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

export interface IFileObject {
  base64: string;
  size: number;
  fileType: string;
  fileName: string;
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Common upload function with configurable file size limit
export async function uploadFiles(
  req: Request, 
  fileType: string, 
  maxFileSize: number = 2 * 1024 * 1024 // Default 2MB
): Promise<{ urls: string[] }> {
  const fileObjects = req.body?.fileDetails as IFileObject[];
  if (!fileObjects || fileObjects.length === 0 || fileObjects.length > 5) {
    throw { code: 400, message: 'Invalid file input. Please provide 1-5 files.' };
  }
  const s3ImagesUrl: string[] = [];
  
  for (const file of fileObjects) {
    if (!file.base64 || !file.fileName) {
      throw { code: 400, message: 'Missing file data. Each file must have base64 content and fileName.' };
    }
    
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(0);
      throw { code: 400, message: `File "${file.fileName}" is too large (max ${maxSizeMB}MB)`};
    }

    try{
      // Validate base64 format
      if (!file.base64.startsWith('data:')) {
        throw { code: 400, message: `Invalid base64 format for "${file.fileName}". Expected format: data:type;base64,content` };
      }

      if (!file.base64.includes(';base64,')) {
        throw { code: 400, message: `Invalid base64 format for "${file.fileName}". Missing base64 encoding declaration.` };
      }

      const base64Parts = file.base64.split(';base64,');
      if (base64Parts.length !== 2 || !base64Parts[1]) {
        throw { code: 400, message: `Invalid base64 format for "${file.fileName}". Malformed base64 content.` };
      }

      // Validate base64 content
      const base64Content = base64Parts[1];
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Content)) {
        throw { code: 400, message: `Invalid base64 content for "${file.fileName}". Contains invalid characters.` };
      }

      const buffer = file.base64.replace(/^data:.+;base64,/, "");
      const fileName = `uploads/${fileType}/${uuidv4()}_${file.fileName}`;
      const base64Header = file.base64.split(";")[0];
      const contentType = base64Header.split(":")[1];

      if (!contentType || contentType.trim() === '') {
          throw { code: 400, message: `Invalid file format for "${file.fileName}". Unable to determine content type from: ${base64Header}` };
      }

      // Validate content type format
      if (!contentType.includes('/')) {
        throw { code: 400, message: `Invalid content type for "${file.fileName}": ${contentType}. Expected format: type/subtype` };
      }

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileName,
        Body: Buffer.from(buffer, "base64"),
        ContentType: contentType,
      };
      
      await s3Client.send(new PutObjectCommand(params));
      const storedUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      
      console.log(`Generated public file URL: ${storedUrl}`);
      s3ImagesUrl.push(storedUrl);

    }catch (error: any) {
      console.error(`Error uploading file "${file.fileName}":`, error);
      throw { code: 500, message: `Failed to upload file "${file.fileName}": ${error.message || 'Unknown error'}` };
    }
  }
  
  console.log(`All generated URLs for ${fileType}:`, s3ImagesUrl);
  return { urls: s3ImagesUrl };
}

export { s3Client };