// js/storage.js
//
// Unified storage API. Routes to localStorage (guest) or Supabase (logged in).
// All functions that touch Supabase are async. Callers must await them.

import { isLoggedIn, getClient } from './auth.js';
import * as cloud from './supabase-storage.js';

const STORAGE_KEYS = {
  solves: 'rubix-timer-solves',
  sessions: 'rubix-timer-sessions',
  pendingSync: 'rubix-timer-pending-sync',
};

const DEFAULT_SESSION_META = { sessions: ['Default'], activeSession: 'Default' };

// --- Internal localStorage helpers (unchanged) ---

function loadJSON(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function localLoadSolves() {
  return loadJSON(STORAGE_KEYS.solves, []);
}

function localSaveSolves(solves) {
  saveJSON(STORAGE_KEYS.solves, solves);
}

function localLoadSessionMeta() {
  return loadJSON(STORAGE_KEYS.sessions, { ...DEFAULT_SESSION_META });
}

function localSaveSessionMeta(meta) {
  saveJSON(STORAGE_KEYS.sessions, meta);
}

// --- Public API ---

export async function addSolve(time, scramble) {
  if (isLoggedIn()) {
    const session = await cloud.getActiveSession(getClient());
    return await cloud.addSolve(getClient(), time, scramble, session);
  }
  const solves = localLoadSolves();
  const solve = {
    id: crypto.randomUUID(),
    time: Math.round(time),
    scramble,
    date: new Date().toISOString(),
    session: getActiveSession(),
  };
  solves.unshift(solve);
  localSaveSolves(solves);
  return solve;
}

export async function addSolveWithContext(time, scramble, sessionName, source, supabaseClient) {
  // Used for P2 saves in local 2P and remote 2P saves
  const client = supabaseClient || getClient();
  return await cloud.addSolve(client, time, scramble, sessionName, source);
}

export async function deleteSolve(id) {
  if (isLoggedIn()) {
    return await cloud.deleteSolve(getClient(), id);
  }
  const solves = localLoadSolves().filter(s => s.id !== id);
  localSaveSolves(solves);
  return solves;
}

export async function loadSolves() {
  if (isLoggedIn()) {
    return await cloud.loadSolves(getClient());
  }
  return localLoadSolves();
}

export async function getSessionSolves() {
  if (isLoggedIn()) {
    const session = await cloud.getActiveSession(getClient());
    return await cloud.getSessionSolves(getClient(), session);
  }
  const active = getActiveSession();
  return localLoadSolves().filter(s => s.session === active);
}

export async function deleteSessionSolves(sessionName) {
  if (isLoggedIn()) {
    return await cloud.deleteSessionSolves(getClient(), sessionName);
  }
  const solves = localLoadSolves().filter(s => s.session !== sessionName);
  localSaveSolves(solves);
  return solves;
}

export async function importSolves(solvesArray) {
  if (isLoggedIn()) {
    const session = await cloud.getActiveSession(getClient());
    return await cloud.importSolves(getClient(), solvesArray, session);
  }
  // Guest mode: merge into localStorage
  const existing = localLoadSolves();
  const existingKeys = new Set(existing.map(s => `${s.time}_${s.date}`));
  const meta = localLoadSessionMeta();
  let imported = 0;

  for (const s of solvesArray) {
    const key = `${s.time}_${s.date}`;
    if (existingKeys.has(key)) continue;
    existing.unshift({
      id: crypto.randomUUID(),
      time: s.time,
      scramble: s.scramble || '',
      date: s.date || new Date().toISOString(),
      session: s.session || meta.activeSession,
    });
    if (s.session && !meta.sessions.includes(s.session)) {
      meta.sessions.push(s.session);
    }
    existingKeys.add(key);
    imported++;
  }

  localSaveSolves(existing);
  localSaveSessionMeta(meta);
  return imported;
}

// --- Session Management ---

export function getActiveSession() {
  // Sync version for guest mode only (used internally)
  return localLoadSessionMeta().activeSession;
}

export async function getActiveSessionAsync() {
  if (isLoggedIn()) {
    return await cloud.getActiveSession(getClient());
  }
  return localLoadSessionMeta().activeSession;
}

export async function setActiveSession(name) {
  if (isLoggedIn()) {
    return await cloud.setActiveSession(getClient(), name);
  }
  const meta = localLoadSessionMeta();
  meta.activeSession = name;
  localSaveSessionMeta(meta);
}

export async function createSession(name) {
  if (isLoggedIn()) {
    return await cloud.createSession(getClient(), name);
  }
  const meta = localLoadSessionMeta();
  if (!meta.sessions.includes(name)) {
    meta.sessions.push(name);
  }
  meta.activeSession = name;
  localSaveSessionMeta(meta);
}

export async function renameSession(oldName, newName) {
  if (isLoggedIn()) {
    return await cloud.renameSession(getClient(), oldName, newName);
  }
  const meta = localLoadSessionMeta();
  const idx = meta.sessions.indexOf(oldName);
  if (idx !== -1) meta.sessions[idx] = newName;
  if (meta.activeSession === oldName) meta.activeSession = newName;
  localSaveSessionMeta(meta);

  const solves = localLoadSolves();
  solves.forEach(s => { if (s.session === oldName) s.session = newName; });
  localSaveSolves(solves);
}

export async function deleteSession(name) {
  if (isLoggedIn()) {
    return await cloud.deleteSession(getClient(), name);
  }
  const meta = localLoadSessionMeta();
  meta.sessions = meta.sessions.filter(s => s !== name);
  if (meta.sessions.length === 0) meta.sessions = ['Default'];
  if (meta.activeSession === name) meta.activeSession = meta.sessions[0];
  localSaveSessionMeta(meta);

  const solves = localLoadSolves().filter(s => s.session !== name);
  localSaveSolves(solves);
}

export async function loadSessionMeta() {
  if (isLoggedIn()) {
    return await cloud.loadSessionMeta(getClient());
  }
  return localLoadSessionMeta();
}

// --- Migration ---

export function getLocalSolveCount() {
  return localLoadSolves().length;
}

export function getLocalSolves() {
  return localLoadSolves();
}

export function clearLocalData() {
  localStorage.removeItem(STORAGE_KEYS.solves);
  localStorage.removeItem(STORAGE_KEYS.sessions);
}

// --- Pending Sync (network failure resilience) ---

export function getPendingSyncs() {
  return loadJSON(STORAGE_KEYS.pendingSync, []);
}

export function addPendingSync(solve) {
  const pending = getPendingSyncs();
  pending.push(solve);
  saveJSON(STORAGE_KEYS.pendingSync, pending);
}

export function clearPendingSyncs() {
  localStorage.removeItem(STORAGE_KEYS.pendingSync);
}

// --- Legacy migration (add session field to old solves) ---

export function migrateData() {
  const solves = localLoadSolves();
  if (solves.length > 0 && solves[0].session === undefined) {
    solves.forEach(s => { s.session = 'Default'; });
    localSaveSolves(solves);
  }
  localSaveSessionMeta(localLoadSessionMeta());
}
