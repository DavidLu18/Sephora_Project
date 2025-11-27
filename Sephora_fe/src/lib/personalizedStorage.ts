"use client";

import { PersonalizedSearchResponse } from "@/api";

const STORAGE_PREFIX = "sephora-personalized-";

export function buildPersonalizedStorageKey(sessionId: string) {
  return `${STORAGE_PREFIX}${sessionId}`;
}

export function savePersonalizedResponse(response: PersonalizedSearchResponse) {
  if (typeof window === "undefined") return;
  const key = buildPersonalizedStorageKey(response.session_id);
  sessionStorage.setItem(key, JSON.stringify(response));
}

export function loadPersonalizedResponse(sessionId: string): PersonalizedSearchResponse | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(buildPersonalizedStorageKey(sessionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersonalizedSearchResponse;
  } catch {
    return null;
  }
}

export function removePersonalizedResponse(sessionId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(buildPersonalizedStorageKey(sessionId));
}


