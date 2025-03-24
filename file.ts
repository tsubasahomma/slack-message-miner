import fs from 'fs/promises';
import { Parser } from 'json2csv';
import { getUnixTimestamp, log } from './utils';
import { NestedMessage, flattenForCsv } from './transformer';

/**
 * Ensures the output/ directory exists.
 */
export const ensureOutputDir = async () => {
  try {
    await fs.mkdir('output', { recursive: true });
  } catch (err) {
    log(`❌ Failed to create output directory: ${err}`, 'fs', true);
  }
};

/**
 * Saves nested JSON and flattened CSV using a consistent filename format.
 */
export const saveNestedToFile = async (
  basename: string,
  nested: NestedMessage[]
): Promise<void> => {
  const timestamp = getUnixTimestamp();

  const jsonName = `output/${basename}_${timestamp}.json`;
  const csvName = `output/${basename}_${timestamp}.csv`;

  try {
    // JSON
    const jsonData = JSON.stringify(nested, null, 2);
    await fs.writeFile(jsonName, jsonData);

    // CSV
    const csvRows = flattenForCsv(nested);
    const csvData = new Parser({
      fields: ['type', 'ts', 'parent_ts', 'text']
    }).parse(csvRows);
    await fs.writeFile(csvName, csvData);

    log(`✅ Saved to ${jsonName} and ${csvName}`, 'save');
  } catch (err: any) {
    log(`❌ Failed to write files: ${err.message}`, 'save', true);
  }
};
