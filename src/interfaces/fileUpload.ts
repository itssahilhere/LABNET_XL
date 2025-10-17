import { Request } from 'express';

export interface IFileObject {
  base64: string;
  size: number;
  fileType: string;
  fileName: string;
}

export interface S3UploadRequest extends Request {
  body: {
    fileDetails?: IFileObject[];
    [key: string]: any;
  };
}
