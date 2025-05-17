import express from 'express'
import fileUpload from 'express-fileupload';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { zoiUploadHandler, checkZoIHandler } from './controllers/zoiUpload.controller';
import { Request, Response, NextFunction } from 'express';

export const STORAGE_DIR = path.join(process.cwd(), 'storage');
export const RESULT_DIR = path.join(STORAGE_DIR, 'result');

const app = express();
const PORT = 3005;

// middleware related stuff 
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Ensure storage directory exists

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(RESULT_DIR)) {
  fs.mkdirSync(RESULT_DIR, { recursive: true });
}

console.log(`Storage directory: ${STORAGE_DIR}`);
console.log(`Result directory: ${RESULT_DIR}`);

// Serve static files from the storage/result directory using the absolute path
app.use('/result', express.static(RESULT_DIR));
app.post('/v1/zoiUpload', zoiUploadHandler as (req: Request, res: Response, next: NextFunction) => any);
app.post('/v1/checkZoI', checkZoIHandler as (req: Request, res: Response, next: NextFunction) => any);

app.listen(PORT, () => {
  console.log(`🧫 ZoI Backend server running on http://localhost:${PORT}`);
});
