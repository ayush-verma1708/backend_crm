import { importData } from '../scripts/script.js';

export const importRecords = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    await importData(req.file.path); // Pass file path to the importData function
    res.status(200).json({ message: 'Data imported successfully' });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error importing data', error: err.message });
  }
};
