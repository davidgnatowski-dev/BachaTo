"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  addUserEventActivity,
  addUserEventProgramActivity,
  getEventBySourceAndId,
  removeUserEventActivity,
  removeUserEventProgramActivity,
  setEventRsvp,
} from "@/lib/db";
import { toLocalIsoDate } from "@/lib/format";

export async function setEventAttendance(source: string, eventId: number, attended: boolean): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !Number.isInteger(eventId) || eventId <= 0 || source.length > 100) return false;

  const event = getEventBySourceAndId(source, eventId);
  if (!event || event.startDate > toLocalIsoDate(new Date())) return false;

  if (attended) await addUserEventActivity(user.id, event);
  else await removeUserEventActivity(user.id, source, eventId);
  return true;
}

export async function setEventProgramAttendance(source: string, eventId: number, sessionId: string, attended: boolean): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !Number.isInteger(eventId) || eventId <= 0 || source.length > 100 || sessionId.length > 160) return false;
  const event = getEventBySourceAndId(source, eventId);
  const item = event?.programItems?.find((entry) => entry.id === sessionId);
  if (!event || !item || new Date(item.startAt) > new Date()) return false;
  if (attended) await addUserEventProgramActivity(user.id, event, item);
  else await removeUserEventProgramActivity(user.id, source, eventId, sessionId);
  return true;
}

export async function setEventGoing(source: string, eventId: number, active: boolean): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !Number.isInteger(eventId) || eventId <= 0 || source.length > 100) return false;
  const event = getEventBySourceAndId(source, eventId);
  if (!event) return false;
  await setEventRsvp(user.id, source, eventId, active);
  return true;
}
