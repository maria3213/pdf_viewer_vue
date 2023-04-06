const express = require('express');
const fsPromise = require('fs').promises;
const fs = require('fs');
const path = require('path');
require("dotenv").config();

const app = express();
const pdfDirectory = __dirname + '/pdfs';


async function readPDFs(directory, isLoop = false) {
    const files = await fsPromise.readdir(directory, { withFileTypes: true });
  
    const pdfs = [];
  
    for (const file of files) {
      const filePath = path.join(directory, file.name);
  
      if (file.isDirectory()) {
        const subPDFs = await readPDFs(filePath, isLoop);
        pdfs.push({
          label: file.name,
          path: filePath,
          children: subPDFs,
        });
      } else if (path.extname(file.name).toLowerCase() === '.pdf') {
        pdfs.push({
            label: file.name,
            path: filePath
        });
      }
    }
  
    return pdfs;
}

// API endpoint to get list of PDF file names
app.get('/pdfs', async (req, res) => {
    const files = await readPDFs(pdfDirectory);
    const pdfs = files.filter(file => {
      if(Array.isArray(file.children)){
        return file.children.every((item) =>  path.extname(item.label).toLowerCase() === '.pdf')
      }else {
        return path.extname(file.label).toLowerCase() === '.pdf'
      }
    });
    res.json(pdfs);
});


// API endpoint to get PDF file stream by filename
app.get('/pdf/:filePath', async (req, res) => {
  const filePath = req.params.filePath;
  const statRes = await fsPromise.stat(filePath);
  if (!statRes.isFile()) {
    console.error(`Could not find file: ${filePath}`);
    return res.status(404).send('File not found');
  }

  const fileStream = fs.createReadStream(filePath);
  res.setHeader('Content-Type', 'application/pdf');
  fileStream.pipe(res);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server started on port 3000');
});