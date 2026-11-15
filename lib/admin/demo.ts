import "server-only";
import { DEMO_EMPLOYEE } from "./admin-account";
import type { Db } from "./types";

/**
 * The one-click employee demo stays open only while the store holds no real customer contact data. The
 * moment a real order, lead or website message arrives it closes by itself (and live demo sessions end),
 * so a forgotten demo can never expose real customers' names, phones, emails or addresses.
 * (Reviews only carry a name and text written for publication, so they don't close it.)
 */
export function demoOpen(db: Db) {
  const real = <T extends { sample?: true }>(list: T[]) => list.some((x) => !x.sample);
  return !real(db.orders) && !real(db.leads) && !real(db.contacts);
}

export const demoEmployee = (db: Db) => (demoOpen(db) ? db.employees.find((x) => x.id === DEMO_EMPLOYEE && x.sample && x.active) : undefined);
