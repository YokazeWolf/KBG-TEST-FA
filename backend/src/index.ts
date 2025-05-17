import express, { Request, Response } from 'express'
import fileUpload, { UploadedFile } from 'express-fileupload';
import cors from 'cors';
import path from 'path';
import { execFile } from 'child_process';
import fs from 'fs';
import { checkPythonVersion } from './util/checkPy';

const app = express();
const PORT = 3005;

// middleware related stuff 
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Ensure storage directory exists
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const RESULT_DIR = path.join(STORAGE_DIR, 'result');

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
if (!fs.existsSync(RESULT_DIR)) {
  fs.mkdirSync(RESULT_DIR, { recursive: true });
}

console.log(`Storage directory: ${STORAGE_DIR}`);
console.log(`Result directory: ${RESULT_DIR}`);

// Serve static files from the storage/result directory using the absolute path
// Make sure the URL path matches what you want to use in the frontend (e.g. /results)
app.use('/result', express.static(RESULT_DIR));

// Usually I'd make a controller folder but since its only two endpoints, I'll just put it here.
app.post('/v1/zoiUpload', (req: any, res: any) => {
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

  // Use the same RESULT_DIR for uploadPath to ensure Python output and static serving match
  const uploadPath = path.join(RESULT_DIR, file.name);

  // in case the directory doesn't exist, create it
  if (!fs.existsSync(RESULT_DIR)) {
    fs.mkdirSync(RESULT_DIR, { recursive: true });
  }

  file.mv(uploadPath, async (err: Error) => {
    if (err) {
      console.error('File move error:', err);
      return res.status(500).send('File saving failed.');
    }

    const pythonScript = path.join(__dirname, 'py', 'zoi_detect.py');
    // Try to get python path from env, otherwise fallback to common names
    const pythonBin = await checkPythonVersion();

    // if pythonBin is false, it means that the python executable was not found
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

          // Convert absolute file path to a public URL
          let imageUrl = null;
          if (data.detection_image) {
            const filename = path.basename(data.detection_image);
            // Use /results for the URL path
            // for production, we should get the actual domain
            // or rather, set it in the frontend
            // but for the sake of simplicity, we'll just use localhost
            imageUrl = `http://localhost:${PORT}/result/${filename}`;
          }

          return res.json({
            message: 'File uploaded and processed!',
            filename: file.name,
            zoi: data.zoi,
            imageUrl:  imageUrl,
          });
        } catch (e) {
          console.error('Failed to parse Python output:', stdout);
          console.error('Parse error:', e);
          return res.status(500).send('Failed to parse result.');
        }
      }
    );
  });
});

// Check if the image is in the CSV file and return the data
app.post('/v1/checkZoI', (req: any, res: any) => {
  if (!req.files || !req.files.image) {
    return res.status(400).send('No file uploaded.');
  }

  const file = req.files.image as UploadedFile;
  const csvPath = path.join(__dirname, '..', 'assets', 'zoi_data.csv');

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

    // get the columns past filename
    const diskColumns = headers.slice(1);

    // find the row matching the filename (without extension)
    const match = lines.slice(1).find((line: String) => {
      const [fname] = line.split(',');
      return fname.trim() === baseName;
    });

    if (!match) {
      return res.status(404).json({ message: 'No data found for this image.' });
    }

    const fields = match.split(',');
    // build only non-empty disk fields
    const zoi = diskColumns
      .map((_: any, idx: number) => {
        const val = (fields[idx + 1] || '').trim();
        if (val) {
          return { diameter_mm: val };
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
});

app.listen(PORT, () => {
  console.log(`🧫 ZoI Backend server running on http://localhost:${PORT}`);
});
