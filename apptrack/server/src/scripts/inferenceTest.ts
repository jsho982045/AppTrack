// src/scripts/inferenceTest.ts
import * as XLSX from 'xlsx';
import path from 'path';

// src/scripts/inferenceTest.ts

interface TrainingEntry {
  _id: string;
  subject: string;
  content: string;
  from: string;
  isApplicationEmail: boolean;
  emailId: string;
  receivedDate: Date;
  verified: boolean;
  __v: string;
  Company: string;  
  Position: string;
}

function findLastColumn(worksheet: XLSX.WorkSheet): number {
  let maxCol = 0;
  for (let key in worksheet) {
      if (key[0] === '!') continue; // Skip special keys
      const col = XLSX.utils.decode_cell(key).c;
      maxCol = Math.max(maxCol, col);
  }
  return maxCol;
}

async function loadTrainingData(): Promise<TrainingEntry[]> {
  try {
      const filePath = path.join(__dirname, '../../../training_data.xlsx');
      console.log('Reading file from:', filePath);
      
      const workbook = XLSX.readFile(filePath, {
        cellDates: true,
        cellNF: true,
        cellText: true,
        cellStyles: true
    });
    
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Print exact sheet name we're reading from
      console.log('Sheet name:', workbook.SheetNames[0]);

      const lastCol = findLastColumn(worksheet);
      console.log(`\nFound ${lastCol + 1} columns`);
      
      // Print raw headers to see exactly what's in Excel
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const headers = [];
      for(let C = range.s.c; C <= lastCol; ++C) {
          const cell = worksheet[XLSX.utils.encode_cell({r: 0, c: C})];
          headers.push(cell ? cell.v : undefined);
      }
      console.log('\nRaw headers:', headers);

      let data = XLSX.utils.sheet_to_json<TrainingEntry>(worksheet);
      
      // Filter for job applications first
      data = data
          .filter(entry => entry.isApplicationEmail === true)
          .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime())
          .slice(0, 10);
      
      console.log(`\nLoaded ${data.length} most recent job application emails`);

      if (data.length > 0) {
          console.log('\nFirst job application email - all fields:');
          console.log(JSON.stringify(data[0], null, 2));
      }

      return data;
  } catch (error) {
      console.error('Error loading training data:', error);
      throw error;
  }
}

async function testDataset() {
  try {
      await loadTrainingData();
  } catch (error) {
      console.error('Error:', error);
  }
}

if (require.main === module) {
  testDataset();
}