import tapsRaw from "@/data/taps.json";
import employeesRaw from "@/data/employees.json";
import doorsByFloorRaw from "@/data/doors-by-floor.json";
import { computeScores, type Tap, type Employee } from "./scoring";

const taps = tapsRaw as Tap[];
export const employees = employeesRaw as Employee[];
export const doorsByFloor = doorsByFloorRaw as Record<
  string,
  { count: number; doors: string[]; liftLobby: string[]; stairExit: string[] }
>;

let cached: ReturnType<typeof computeScores> | null = null;

export function getScores() {
  if (!cached) cached = computeScores(taps, employees);
  return cached;
}
