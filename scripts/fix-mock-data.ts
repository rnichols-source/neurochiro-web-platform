import fs from 'fs';
import path from 'path';
import { MOCK_DOCTORS } from '../src/lib/mock-data';

const MOCK_DATA_PATH = path.resolve(__dirname, '../src/lib/mock-data.ts');

async function fixData() {
  console.log("🛠 FIXING MOCK DOCTOR DATA...");
  
  const doctors = MOCK_DOCTORS;
  console.log(`📊 Processing ${doctors.length} records...`);

  const fixedDoctors = doctors.map((doc: any) => {
    let firstName = doc.first_name || "";
    let lastName = doc.last_name || "";

    // If first_name is empty, assume lastName contains the full name
    if ((!firstName || firstName === "") && lastName) {
      const parts = lastName.replace('Dr. ', '').trim().split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    // Double check if Dr. is still in first name
    if (firstName.startsWith('Dr. ')) {
        firstName = firstName.replace('Dr. ', '');
    }
    if (firstName.startsWith('Dr.')) {
        firstName = firstName.replace('Dr.', '');
    }

    // Clean up any double spaces or whitespace
    firstName = firstName.trim();
    lastName = lastName.trim();

    // Generate a clean slug: first-last
    const cleanSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    return {
      ...doc,
      first_name: firstName,
      last_name: lastName,
      slug: cleanSlug
    };
  });

  const tsContent = `import { Doctor } from "@/types/directory";

export const MOCK_DOCTORS: Doctor[] = ${JSON.stringify(fixedDoctors, null, 2)};
`;

  fs.writeFileSync(MOCK_DATA_PATH, tsContent);
  console.log("✅ Successfully fixed doctor names and slugs.");
}

fixData();
