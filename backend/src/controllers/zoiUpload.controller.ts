import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { checkPythonVersion } from '../util/checkPy';
import { UploadedFile } from 'express-fileupload';
import { RESULT_DIR } from '../index';

export const zoiUploadHandler = (req: Request, res: Response) => {
  if (!req.files || !req.files.image) {
    console.error('No file uploaded.');
    return res.status(400).send('No file uploaded.');
  }

  const file = req.files.image as UploadedFile;

  // filetype check
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return res.status(400).send('Invalid file type. Only PNG/JPG allowed.');
  }

  const uploadPath = path.join(RESULT_DIR, file.name);

  if (!fs.existsSync(RESULT_DIR)) {
    fs.mkdirSync(RESULT_DIR, { recursive: true });
  }

  file.mv(uploadPath, async (err: Error) => {
    if (err) {
      console.error('File move error:', err);
      return res.status(500).send('File saving failed.');
    }

    const pythonScript = path.join(__dirname, '..', 'py', 'zoi_detect.py');
    const pythonBin = await checkPythonVersion();

    if (!pythonBin) {
      console.error('Python executable not found. Set PYTHON_PATH or install Python.');
      return res.status(500).json({ error: 'Python executable not found. Set PYTHON_PATH or install Python.', code: "py_not_found" });
    }

    console.log(`Executing: ${pythonBin} ${pythonScript} ${uploadPath}`);

    execFile(
      pythonBin,
      [pythonScript, uploadPath],
      {},
      (error, stdout, stderr) => {
        fs.unlinkSync(uploadPath);

        if (error) {
          console.error('Python error:', error.message);
          console.error('Python stderr:', stderr);
          return res.status(500).send('Image processing failed.');
        }

        try {
          console.log('Python stdout:', stdout);
          const data = JSON.parse(stdout);

          let imageUrl = null;
          if (data.detection_image) {
            const filename = path.basename(data.detection_image);
            imageUrl = `http://localhost:3005/result/${filename}`;
          }

          return res.json({
            message: 'File uploaded and processed!',
            filename: file.name,
            zoi: data.zoi,
            imageUrl: imageUrl,
          });
        } catch (e) {
          console.error('Failed to parse Python output:', stdout);
          console.error('Parse error:', e);
          return res.status(500).send('Failed to parse result.');
        }
      }
    );
  });
};

export const checkZoIHandler = (req: Request, res: Response) => {
  if (!req.files || !req.files.image) {
    return res.status(400).send('No file uploaded.');
  }

  const file = req.files.image as UploadedFile;
  const csvPath = path.join(__dirname, '..', '..', 'assets', 'zoi_data.csv');

  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.name).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return res.status(400).send('Invalid file type. Only PNG/JPG allowed.');
  }

  const baseName = path.basename(file.name, ext);

  fs.readFile(csvPath, 'utf8', (err, data) => {
    if (err) {
      console.error('CSV read error:', err);
      return res.status(500).send('Failed to read CSV.');
    }

    const lines = data.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return res.status(500).send('CSV is empty.');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const diskColumns = headers.slice(1);

    const match = lines.slice(1).find((line: String) => {
      const [fname] = line.split(',');
      return fname.trim() === baseName;
    });

    if (!match) {
      return res.status(404).json({ message: 'No data found for this image.' });
    }

    const fields = match.split(',');
    const zoi = diskColumns
      .map((_: any, idx: number) => {
        const val = (fields[idx + 1] || '').trim();
        if (val) {
          return { diameter_mm: Number(val.replace('mm', '')) };
        }
        return null;
      })
      .filter((disk: any) => disk !== null);

    return res.json({
      message: 'ZoI data fetched.',
      filename: file.name,
      zoi
    });
  });
};
