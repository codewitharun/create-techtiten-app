// No database picked: data lives in memory and is lost on restart (fine for trying things out).
// Add one later: `npx create-techtiten-app add db` (firestore | mongo | postgres).
export const memory = new Map<string, Map<string, unknown>>();
export const table = <T>(name: string) => {
  if (!memory.has(name)) memory.set(name, new Map());
  return memory.get(name) as Map<string, T>;
};
