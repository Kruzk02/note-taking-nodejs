import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from 'url';

export function getFile(filename) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.resolve(__dirname, "../../uploads/", filename); 
}

export function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

export async function readFile(filePath) {
  return await fs.readFile(filePath); 
}
