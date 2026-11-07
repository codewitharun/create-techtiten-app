// No database picked: data lives in memory and is lost on restart (fine for trying things out).
// To use a real one, create the project with --db=firestore|mongo|postgres (or copy that model/db.ts in).
export const memory = new Map<string, Map<string, unknown>>();
export const table = <T>(name: string) => {
  if (!memory.has(name)) memory.set(name, new Map());
  return memory.get(name) as Map<string, T>;
};
