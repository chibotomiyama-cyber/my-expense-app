import React, { useState, useEffect, useMemo } from "react";

const CATEGORIES = [
  { id: "entertainment", label: "接待交際費", emoji: "🤝", color: "#C9873A", examples: "手土産・贈答品・飲食店" },
  { id: "transport", label: "交通費", emoji: "🚄", color: "#3A7FC9", examples: "ホテル・電車・飛行機・新幹線" },
  { id: "supplies", label: "消耗品", emoji: "📦", color: "#4CAF82", examples: "切手・文房具・事務用品" },
  { id: "ceremony", label: "冠婚葬祭費", emoji: "🌸", color: "#C94F8C", examples: "祝儀・香典（レシート不要）" },
  { id: "misc", label: "雑費", emoji: "📋", color: "#8C6CC9", examples: "制服など上記以外" },
];

const STORAGE_KEY = "expenses_data_v1";

// ユーティリティ関数
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${y}年${m}月${d}日`;
};

const formatAmount = (n) => "¥" + Number(n).toLocaleString("ja-JP");

const getYearMonth = (dateStr) => {
  if (!dateStr) return "";
  const [y, m] = dateStr.split("-");
  return `${y}年${m}月`;
};

const toCSV = (expenses) => {
  const header = ["日付", "カテゴリ", "金額", "メモ"];
  const rows = expenses.map(e => {
    const cat = CATEGORIES.find(c => c.id === e.category);
    return [e.date, cat?.label || e.category, e.amount, e.note || ""];
  });
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  return "\uFEFF" + csv;
};

export default function ExpenseApp() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: "", category: "entertainment", note: "" });
  const [activeTab, setActiveTab] = useState("add");
  const [filterMonth, setFilterMonth] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // データの読み込み (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setExpenses(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }
    setLoaded(true);
  }, []);

  // データの保存 (localStorage)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, loaded]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAdd = () => {
    if (!form.date || !form.amount || Number(form.amount) <= 0) {
      showToast("日付と金額を正しく入力してください", "error");
      return;
    }
    const newExpense = { id: Date.now(), ...form, amount: Number(form.amount) };
    setExpenses(prev => [newExpense, ...prev]);
    setForm(f => ({ ...f, amount: "", note: "" }));
    showToast("経費を追加しました ✓");
    setActiveTab("list");
  };

  const handleDelete = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
    showToast("削除しました");
  };

  const months = useMemo(() => {
    const s = new Set(expenses.map(e => getYearMonth(e.date)).filter(Boolean));
    return Array.from(s).sort().reverse();
  }, [expenses]);

  const filtered = useMemo(() => {
    if (!filterMonth) return expenses;
    return expenses.filter(e => getYearMonth(e.date) === filterMonth);
  }, [expenses, filterMonth]);

  const monthTotal = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const catTotals = useMemo(() => {
    const m = {};
    filtered.forEach(e => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return m;
  }, [filtered]);

  const handleExport = () => {
    const target = filterMonth ? filtered : expenses;
    if (target.length === 0) { showToast("データがありません", "error"); return; }
    const blob = new Blob([toCSV(target)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `経費精算_${filterMonth || "全期間"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSVを保存しました 📥");
  };

  const selCat = CATEGORIES.find(c => c.id === form.category);

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", background: "linear-gradient(135deg, #0D1B2A 0%, #1B2E45 50%, #0D1B2A 100%)", minHeight: "100vh", color: "#E8EDF2" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Shippori+Mincho:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
        .gold { color: #C9873A; }
        .tab-btn { transition: all 0.2s; border: none; cursor: pointer; }
        .tab-btn.active { background: #C9873A; color: #0D1B2A; font-weight: 700; }
        .tab-btn:not(.active) { color: #8CA0B8; background: transparent; }
        .input-field { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 12px 14px; color: #E8EDF2; width: 100%; font-size: 15px; }
        .add-btn { background: linear-gradient(135deg, #C9873A, #E8A84E); color: #0D1B2A; font-weight: 700; border: none; cursor: pointer; width: 100%; padding: 16px; border-radius: 14px; font-size: 16px; }
        .cat-pill { cursor: pointer; border-radius: 10px; padding: 10px 12px; border: 2px solid transparent; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); }
        .cat-pill.selected { border-color: var(--cat-color); background: rgba(255,255,255,0.1); }
        .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 999; padding: 12px 24px; border-radius: 30px; }
        .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 900; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 26, fontWeight: 700 }}>
          <span className="gold">経</span>費精算
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px", maxWidth: 480, margin: "0 auto" }}>
        {[["add", "➕ 入力"], ["list", "📋 履歴"], ["summary", "📊 集計"]].map(([t, l]) => (
          <button key={t} className={`tab-btn ${activeTab === t ? "active" : ""}`}
            style={{ flex: 1, padding: "10px", borderRadius: 10 }}
            onClick={() => setActiveTab(t)}>{l}</button>
        ))}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        {activeTab === "add" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: "#8CA0B8", marginBottom: 8 }}>📅 日付</div>
              <input type="date" className="input-field" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: "#8CA0B8", marginBottom: 8 }}>💴 金額（円）</div>
              <input type="number" className="input-field" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} inputMode="numeric" />
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: "#8CA0B8", marginBottom: 10 }}>🏷️ カテゴリ</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <div key={cat.id} className={`cat-pill ${form.category === cat.id ? "selected" : ""}`}
                    style={{ "--cat-color": cat.color }}
                    onClick={() => setForm(f => ({ ...f, category: cat.id }))}>
                    <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: form.category === cat.id ? cat.color : "#E8EDF2" }}>{cat.label}</div>
                      <div style={{ fontSize: 11, color: "#8CA0B8" }}>{cat.examples}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, color: "#8CA0B8", marginBottom: 8 }}>📝 メモ</div>
              <textarea className="input-field" rows={3} placeholder="任意" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} style={{ resize: "none" }} />
            </div>
            <button className="add-btn" onClick={handleAdd}>保存する</button>
          </div>
        )}

        {activeTab === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <select className="input-field" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
              <option value="">全期間</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {filtered.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#8CA0B8" }}>データがありません</div> : 
              filtered.map(exp => {
                const cat = CATEGORIES.find(c => c.id === exp.category);
                return (
                  <div key={exp.id} className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cat?.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{cat?.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: cat?.color }}>{cat?.label}</span>
                        <span style={{ fontWeight: 700 }}>{formatAmount(exp.amount)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#8CA0B8" }}>{formatDate(exp.date)} {exp.note}</div>
                    </div>
                    <button onClick={() => setDeleteConfirm(exp.id)} style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer" }}>🗑️</button>
                  </div>
                );
              })
            }
          </div>
        )}

        {activeTab === "summary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="card" style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#8CA0B8" }}>合計</div>
              <div className="gold" style={{ fontSize: 32, fontWeight: 700 }}>{formatAmount(monthTotal)}</div>
            </div>
            <button className="add-btn" onClick={handleExport}>CSVで書き出す</button>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="modal-bg" onClick={() => setDeleteConfirm(null)}>
          <div className="card" style={{ padding: 24, textAlign: "center" }} onClick={e => e.stopPropagation()}>
            <p>削除しますか？</p>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "10px 20px" }}>キャンセル</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ background: "#FF6B6B", color: "white", border: "none", padding: "10px 20px", borderRadius: 8 }}>削除</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" style={{ background: toast.type === "error" ? "#FF6B6B" : "#4CAF82", color: "white" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
