import { useState, useEffect } from "react";
import { ALL_BATCHES, getSubjectName } from "../utils/constants";
import { getPublishedStatus, getStudentTimetable, downloadBatchTimetable, getVersions, API_BASE } from "../utils/api";
import TimetableGrid from "../components/TimetableGrid";
import Chip from "../components/Chip";

export default function StudentPortal({ user, onLogout }) {
  const [batch, setBatch] = useState("A1");
  const [entries, setEntries] = useState([]);
  const [orderedDays,  setOrderedDays]  = useState([]);
  const [orderedTimes, setOrderedTimes] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [published, setPublished] = useState(null); // null = checking
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [versionTitle, setVersionTitle] = useState("");
  
  // Personalized mode states
  const [isPersonalized, setIsPersonalized] = useState(false); // Initially off
  const [mySubjects, setMySubjects] = useState(() => {
    const saved = localStorage.getItem("jiit_my_subjects");
    return saved ? JSON.parse(saved) : [];
  });
  const [subjectColors, setSubjectColors] = useState(() => {
    const saved = localStorage.getItem("jiit_subject_colors");
    return saved ? JSON.parse(saved) : {};
  });
  const [allPossibleSubjects, setAllPossibleSubjects] = useState([]); // All unique subjects in the version

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Check if timetable is published and fetch versions
  useEffect(() => {
    getPublishedStatus()
      .then(data => setPublished(data.published))
      .catch(() => setPublished(false));

    getVersions().then(data => {
      setVersions(data);
      const publishedVersions = data.filter(v => v.status === "published");
      if (publishedVersions.length > 0) {
        setSelectedVersion(publishedVersions[0]._id);
      } else {
        setSelectedVersion("");
      }
    }).catch(console.error);
  }, []);

  // Fetch all subjects for the version whenever it changes
  useEffect(() => {
    if (!selectedVersion) return;
    
    fetch(`${API_BASE}/timetable/${selectedVersion}/entries`)
      .then(res => res.json())
      .then(data => {
        const entries = data.entries || [];
        const batchRegex = /^[A-C]\d{1,2}$/i;
        const uniqueSubs = [...new Set(entries.map(e => e.subject))]
          .filter(s => s && s.length > 2 && !batchRegex.test(s))
          .sort();
        setAllPossibleSubjects(uniqueSubs);
      })
      .catch(err => console.error("Failed to fetch all subjects:", err));
  }, [selectedVersion]);

  // Save personalized settings
  useEffect(() => {
    localStorage.setItem("jiit_personal_mode", isPersonalized);
    localStorage.setItem("jiit_my_subjects", JSON.stringify(mySubjects));
    localStorage.setItem("jiit_subject_colors", JSON.stringify(subjectColors));
  }, [isPersonalized, mySubjects, subjectColors]);

  const search = async () => {
    setError("");
    setLoading(true);
    setSearched(false);
    try {
      const data = await getStudentTimetable(batch, selectedVersion);
      setEntries(data.entries);
      setVersionTitle(data.title || "");
      
      if (data.orderedDays?.length)  setOrderedDays(data.orderedDays);
      if (data.orderedTimes?.length) setOrderedTimes(data.orderedTimes);
      setSearched(true);
      if (data.entries.length === 0) setError(`No classes found for Batch ${batch}. Try a different batch code like A1, A2, B1, B3, G1 etc.`);
    } catch (err) {
      setError(err.message);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadBatchTimetable(selectedVersion, batch);
      showToast(`📥 Downloading Batch ${batch} timetable…`);
    } catch (err) {
      showToast("❌ " + err.message, "error");
    } finally {
      setDownloading(false);
    }
  };

  const toggleSubject = (sub) => {
    if (!sub) return;
    setMySubjects(prev => 
      prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
    );
  };

  const updateSubjectColor = (sub, color) => {
    setSubjectColors(prev => ({ ...prev, [sub]: color }));
  };

  const filteredEntries = isPersonalized 
    ? entries.filter(e => mySubjects.includes(e.subject))
    : entries;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 18, right: 18, zIndex: 9999,
          background: toast.type === "error" ? "#1a0000" : "#0a1a0a",
          border: `1px solid ${toast.type === "error" ? "#ef4444" : "#22c55e"}`,
          borderRadius: 12, padding: "12px 18px", fontSize: 13,
          color: toast.type === "error" ? "#f87171" : "#4ade80",
          boxShadow: "0 8px 30px rgba(0,0,0,.5)",
          animation: "fadeUp .25s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ padding: "13px 24px", borderBottom: "1px solid rgba(255,255,255,.05)", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 34, height: 34, background: "#1e1a3a", border: "1px solid rgba(124,58,237,.4)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📅</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>JIIT SmartSched</div>
              <div style={{ fontSize: 10, color: "#6b7280" }}>Student Portal · B.Tech II Sem Even 2026</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {published === null && <span style={{ fontSize: 11, color: "#6b7280" }}>Checking status…</span>}
          {published === true && <Chip text="🟢 Timetable Live" bg="#22c55e" />}
          {published === false && <Chip text="🔴 Not Published" bg="#ef4444" />}
          <span style={{ fontSize: 12, color: "#9ca3af" }}>👋 {user.name}</span>
          <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* Not published banner */}
        {published === false && (
          <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 14, padding: "16px 20px", marginBottom: 22, display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 28 }}>📭</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 3 }}>Timetable Not Published Yet</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>The admin hasn't published the timetable yet. Please check back later.</div>
            </div>
          </div>
        )}

        {/* Search card */}
        <div className="card fadein" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 5 }}>🔍 Find Your Timetable</h2>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>Select the timetable and your Batch/Section to view and download your weekly schedule</p>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isPersonalized ? "1.5fr 0.8fr 1.5fr auto" : "2fr 1fr auto auto", 
            gap: 12, 
            alignItems: "flex-end" 
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5, fontWeight: 500 }}>Timetable</div>
              <select className="inp" value={selectedVersion} onChange={e => setSelectedVersion(e.target.value)}>
                {versions.filter(v => v.status === "published").length === 0
                  ? <option value="">— No published timetables —</option>
                  : versions.filter(v => v.status === "published").map(v => (
                      <option key={v._id} value={v._id}>{v.title}</option>
                    ))
                }
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5, fontWeight: 500 }}>Batch / Section</div>
              <select className="inp" value={batch} onChange={e => setBatch(e.target.value)}>
                {ALL_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {isPersonalized && (
              <div className="fadein">
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 5, fontWeight: 500 }}>Add Subject</div>
                <select 
                  className="inp" 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) toggleSubject(val);
                    e.target.value = "";
                  }}
                >
                  <option value="">+ Select Subject...</option>
                  {allPossibleSubjects
                    .filter(s => !mySubjects.includes(s))
                    .map(s => (
                      <option key={s} value={s}>{s} — {getSubjectName(s)}</option>
                    ))
                  }
                </select>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-purple" style={{ whiteSpace: "nowrap", padding: "11px 18px" }}
                onClick={search} disabled={loading || !published || !selectedVersion}>
                {loading ? "Loading..." : "View Schedule →"}
              </button>
              <button 
                className={`btn ${isPersonalized ? 'btn-purple' : 'btn-ghost'}`} 
                style={{ padding: "11px 15px", border: isPersonalized ? 'none' : '1px solid rgba(255,255,255,.1)' }}
                onClick={() => setIsPersonalized(!isPersonalized)}
                title="Toggle Personalized Mode"
              >
                {isPersonalized ? "✨ ON" : "👤 Personalize"}
              </button>
            </div>
          </div>

          {/* Selected Subjects Chips with Color Pickers */}
          {isPersonalized && mySubjects.length > 0 && (
            <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 8 }} className="fadein">
              {mySubjects.map(sub => (
                <div key={sub} style={{
                  padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: "rgba(124,58,237,.12)", border: `1px solid ${subjectColors[sub] || 'rgba(124,58,237,.3)'}`,
                  color: subjectColors[sub] || "#a78bfa", display: "flex", alignItems: "center", gap: 10
                }}>
                  <div style={{ position: "relative", width: 14, height: 14 }}>
                    <div style={{ 
                      width: 14, height: 14, borderRadius: "50%", 
                      background: subjectColors[sub] || "#7c3aed", cursor: "pointer",
                      boxShadow: "0 0 5px rgba(0,0,0,.3)"
                    }} />
                    <input 
                      type="color" 
                      value={subjectColors[sub] || "#7c3aed"}
                      onChange={(e) => updateSubjectColor(sub, e.target.value)}
                      style={{ 
                        position: "absolute", top: 0, left: 0, width: "100%", 
                        height: "100%", opacity: 0, cursor: "pointer" 
                      }} 
                    />
                  </div>
                  {sub}
                  <span onClick={() => toggleSubject(sub)} style={{ cursor: "pointer", opacity: 0.6, fontSize: 16 }}>×</span>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 9, padding: "2px 10px" }} onClick={() => setMySubjects([])}>Clear All</button>
            </div>
          )}
        </div>

        {/* Results */}
        {searched && (
          <div className="fadein">
            {error ? (
              <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🔍</div>
                <h3 style={{ color: "#fff", marginBottom: 8 }}>{published === false ? "Timetable Not Published" : "No Classes Found"}</h3>
                <p style={{ color: "#6b7280", fontSize: 13 }}>{error}</p>
              </div>
            ) : (
              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>📅 {versionTitle || "Timetable"} — Batch {batch}</h3>
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{entries.length} class entries this week</p>
                  </div>
                  <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                    <Chip text={isPersonalized ? "✨ Personalized View" : `Batch ${batch}`} bg={isPersonalized ? "#7c3aed" : "#34d399"} />
                    <button className="btn btn-green btn-sm" onClick={handleDownload} disabled={downloading}>
                      {downloading ? "Generating…" : "📥 Download Excel"}
                    </button>
                  </div>
                </div>
                <div style={{ padding: 16 }}>
                  <TimetableGrid 
                    entries={filteredEntries} 
                    batchFilter={isPersonalized ? null : batch} 
                    isStudent={true} 
                    orderedDays={orderedDays} 
                    orderedTimes={orderedTimes}
                    customColors={subjectColors}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info cards when nothing searched */}
        {!searched && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="fadein">
            {[
              ["📚", "Weekly Schedule", "See all Lectures, Tutorials and Practicals for the week in one grid"],
              ["📥", "Download Excel", "Download your personal timetable as a formatted Excel file"],
              ["👨‍🏫", "Teacher & Room", "Know which faculty and room for each of your classes"],
            ].map(([icon, title, desc]) => (
              <div key={title} className="card" style={{ padding: 22, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 7 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
