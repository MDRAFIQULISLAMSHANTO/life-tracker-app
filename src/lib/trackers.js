import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export const TRACKER_TYPES = {
  HABIT: 'habit',
  READING: 'reading',
  GOAL: 'goal'
}

const LS_TRACKERS_KEY = 'livio_trackers_v1'
const LS_ENTRIES_KEY = 'livio_tracker_entries_v1'

function safeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function loadJson(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function withTimeout(promise, ms, label = 'Request') {
  let t
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

function lsGetAllTrackers() {
  return loadJson(LS_TRACKERS_KEY, [])
}

function lsSetAllTrackers(trackers) {
  saveJson(LS_TRACKERS_KEY, trackers)
}

function lsGetAllEntries() {
  return loadJson(LS_ENTRIES_KEY, [])
}

function lsSetAllEntries(entries) {
  saveJson(LS_ENTRIES_KEY, entries)
}

async function tryFirestore(op) {
  try {
    // Firestore can hang (rules/network). Keep UI fast with a short timeout.
    return await withTimeout(op(), 2000, 'Firestore')
  } catch (e) {
    // Fall back to local storage for offline/dev mode.
    return { __fallback: true, error: e }
  }
}

export async function createTracker(userId, trackerData) {
  const newTracker = {
    ...trackerData,
    userId,
    createdAt: new Date().toISOString(),
  }

  const fs = await tryFirestore(async () => {
    const trackersRef = collection(db, 'trackers')
    const docRef = await addDoc(trackersRef, newTracker)
    return { id: docRef.id, ...newTracker }
  })

  if (!fs?.__fallback) return fs

  const all = lsGetAllTrackers()
  const local = { id: safeId(), ...newTracker, _storage: 'local' }
  lsSetAllTrackers([local, ...all])
  return local
}

export async function getTrackerById(trackerId) {
  const fs = await tryFirestore(async () => {
    const docRef = doc(db, 'trackers', trackerId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  })

  if (!fs?.__fallback) return fs

  const all = lsGetAllTrackers()
  return all.find((t) => t.id === trackerId) || null
}

export async function getUserTrackers(userId) {
  const fs = await tryFirestore(async () => {
    const trackersRef = collection(db, 'trackers')
    const q = query(trackersRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)
    const trackers = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    return trackers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  if (!fs?.__fallback) return fs

  const all = lsGetAllTrackers()
  const filtered = all.filter((t) => t.userId === userId)
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function addTrackerEntry(trackerId, userId, entryData) {
  const newEntry = {
    ...entryData,
    trackerId,
    userId,
    date: entryData.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  }

  const fs = await tryFirestore(async () => {
    const entriesRef = collection(db, 'tracker_entries')
    const docRef = await addDoc(entriesRef, newEntry)
    return { id: docRef.id, ...newEntry }
  })

  if (!fs?.__fallback) return fs

  const all = lsGetAllEntries()
  const local = { id: safeId(), ...newEntry, _storage: 'local' }
  lsSetAllEntries([local, ...all])
  return local
}

export async function getTrackerEntries(trackerId) {
  const fs = await tryFirestore(async () => {
    const entriesRef = collection(db, 'tracker_entries')
    const q = query(entriesRef, where('trackerId', '==', trackerId))
    const querySnapshot = await getDocs(q)
    const entries = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    return entries.sort((a, b) => new Date(b.date) - new Date(a.date))
  })

  if (!fs?.__fallback) return fs

  const all = lsGetAllEntries()
  const filtered = all.filter((e) => e.trackerId === trackerId)
  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
}
