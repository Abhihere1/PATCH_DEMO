import fs from "fs";
import path from "path";

const KB_DIR = path.join(process.cwd(), "knowledge_base", "workflows");

export function kbFileExists(filename: string): boolean {
  try {
    return fs.existsSync(path.join(KB_DIR, filename));
  } catch {
    return false;
  }
}

export function getKbContent(category: string): string | null {
  const filename = `${category.toLowerCase()}.md`;
  const filePath = path.join(KB_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export function getAllKbContent(): string {
  try {
    if (!fs.existsSync(KB_DIR)) return "";
    const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".md"));
    return files
      .map((filename) => {
        const category = filename.replace(".md", "").toUpperCase();
        const content = fs.readFileSync(path.join(KB_DIR, filename), "utf-8");
        return `[CATEGORY: ${category} | FILE: ${filename}]\n${content}`;
      })
      .join("\n\n---\n\n");
  } catch {
    return "";
  }
}

export function vdiKbAvailable(): boolean {
  return kbFileExists("vdi.md");
}
