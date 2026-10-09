import { readdir } from "node:fs/promises";
import { resolve, join } from "node:path";
export async function discoverMocks(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, {
      recursive: true,
      withFileTypes: true,
    });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".mock.ts"))
      .map((e) => resolve(join(e.parentPath, e.name)))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
