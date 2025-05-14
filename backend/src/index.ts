  import express, { Request, Response } from 'express'
  import fileUpload, { UploadedFile } from 'express-fileupload';
  import cors from 'cors';
  import path from 'path';
  import { execFile } from 'child_process';
  import fs from 'fs';

  // also just as a side note, I am using tsx, since ts-node has been known for having isues with module resolutions.

  const app = express();
  const PORT = 3005;

  // middleware related stuff 
  app.use(cors());
  app.use(express.json());
  app.use(fileUpload());

  // Usually I'd make a controller folder but since its only two endpoints, I'll just put it here.
  /* I tried with openCV but it was a bit difficult and had limited time tonight, so I'll leave this here
  for reference 🤷 */

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

  const storageDir = path.join(__dirname, '../..', 'storage');
  const uploadPath = path.join(storageDir, file.name);

  // in case the directory doesn't exist, create it
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  file.mv(uploadPath, (err) => {
    if (err) {
      console.error('File move error:', err);
      return res.status(500).send('File saving failed.');
    }

    const pythonScript = path.join(__dirname, 'py', 'zoi_detect.py');
    const pythonBin = process.env.PYTHON_PATH || '/home/wolf/Documents/tests/zoi-detect/.venv/bin/python';

    console.log(`Executing: ${pythonBin} ${pythonScript} ${uploadPath}`);

    execFile(
      pythonBin,
      [pythonScript, uploadPath],
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
          return res.json({
            message: 'File uploaded and processed!',
            filename: file.name,
            zoi: data,
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
app.post('/v1/checkZoI',  (req: any, res: any)  => {
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
    const match = lines.slice(1).find(line => {
      const [fname] = line.split(',');
      return fname.trim() === baseName;
    });

    if (!match) {
      return res.status(404).json({ message: 'No data found for this image.' });
    }

    const fields = match.split(',');
    // build only non-empty disk fields
    const zoi = diskColumns
      .map((_, idx) => {
        const val = (fields[idx + 1] || '').trim();
        if (val) {
          return { diameter_mm: val };
        }
        return null;
      })
      .filter((disk) => disk !== null);

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
