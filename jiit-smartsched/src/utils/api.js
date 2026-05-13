// All API calls to the backend
const BASE = "https://smartsched-1.onrender.com/api/timetable";

// Helper: trigger a file download from a Blob
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Admin ────────────────────────────────────────────────────

export async function uploadTimetable(files, title) {
  const fd = new FormData();
  if (title) fd.append("title", title);
  const fileArray = Array.isArray(files) ? files : Array.from(files);
  for (let file of fileArray) {
    fd.append("timetable", file);
  }
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: fd });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getEntries(id) {
  const res = await fetch(`${BASE}/${id}/entries`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getClashes(id) {
  const res = await fetch(`${BASE}/${id}/clashes`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function resolveClash(id, index, options = {}) {
  const res = await fetch(`${BASE}/${id}/clashes/${index}/resolve`, { 
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options)
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function resolveAllClashes(id) {
  const res = await fetch(`${BASE}/${id}/clashes/resolve-all`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function moveEntry(id, dragData, newDay, newTime) {
  const res = await fetch(`${BASE}/${id}/entries/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...dragData, newDay, newTime })
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function publishTimetable(id) {
  const res = await fetch(`${BASE}/${id}/publish`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getVersions() {
  const res = await fetch(`${BASE}/versions`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function restoreVersion(id) {
  const res = await fetch(`${BASE}/${id}/restore`, { method: "POST" });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function deleteVersion(id) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function downloadFullTimetable(id) {
  const res = await fetch(`${BASE}/${id}/download/full`);
  if (!res.ok) throw new Error((await res.json()).error);
  const blob = await res.blob();
  downloadBlob(blob, `JIIT_Timetable_${id}.xlsx`);
}

// ── Student ──────────────────────────────────────────────────

export async function getPublishedStatus() {
  const res = await fetch(`${BASE}/published`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getStudentTimetable(batch, versionId = "active") {
  const url = versionId !== "active" ? `${BASE}/student?batch=${batch}&versionId=${versionId}` : `${BASE}/student?batch=${batch}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function downloadBatchTimetable(id, batch) {
  const res = await fetch(`${BASE}/${id}/download/batch/${batch}`);
  if (!res.ok) throw new Error((await res.json()).error);
  const blob = await res.blob();
  downloadBlob(blob, `JIIT_Timetable_Batch_${batch}.xlsx`);
}