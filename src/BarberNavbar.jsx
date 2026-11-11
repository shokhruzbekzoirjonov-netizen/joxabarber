import { useState, useEffect, useMemo } from "react";
import { Scissors } from "lucide-react";

const TELEGRAM_BOT_TOKEN = "8952129410:AAGCxdTKV9F9_Vb40vftG1qCSULsVBPiOMc";
const TELEGRAM_CHAT_ID = "-5012396870";
const BARBER_PHONE = "886446766"; // Sartaroshning maxsus raqami

// ====== XIZMATLAR VA QIZIQARLI TA'RIFLAR (shu yerdan o'zgartiring) ======
const SERVICES = [
  { name: "Soch olish", desc: "Yuz tuzilishingizga mos ideal imidj 🔥" },
  { name: "Yosh bolalarga soch olish", desc: "Kichkintoylar uchun zamonaviy va qulay stilar 😎" },
  { name: "Kuyov bola style", desc: "Unutilmas kuningizda mukammal ko'rinish 👑" },
  { name: "Soch bo'yash", desc: "Tabiiy ko'rinish va sifatli ranglar uyg'unligi ✨" },
  { name: "Jingalak soch qilish", desc: "Trenddagi uzoq saqlanuvchi perm stili ⚡" },
];

const DOW = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const MON = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
const MON_FULL = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const C = {
  bg: "#1C1B1A", card: "#242220", cream: "#F3EDE3", dim: "#c9c2b4",
  gold: "#C9A227", goldB: "#E4BE3F", green: "#3F7A5B", red: "#A6453A",
  greenBg: "rgba(63,122,91,0.14)", greenBd: "rgba(63,122,91,0.55)",
  redBg: "rgba(166,69,58,0.14)", redBd: "rgba(166,69,58,0.55)",
};
const serif = "'Playfair Display', serif";
const mono = "'Space Mono', monospace";

const pad = (n) => (n < 10 ? "0" + n : "" + n);
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const digits = (t) => String(t).replace(/\D/g, "").slice(-9);

const store = {
  async get(k) {
    try {
      if (window.storage) {
        const r = await window.storage.get(k, true);
        return r && r.value ? r.value : null;
      }
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  async set(k, v) {
    if (window.storage) await window.storage.set(k, v, true);
    else localStorage.setItem(k, v);
  },
};

async function loadDay(d) {
  const v = await store.get("band-" + dateKey(d));
  try {
    return v ? JSON.parse(v) : {};
  } catch (e) {
    return {};
  }
}
const saveDay = (d, data) => store.set("band-" + dateKey(d), JSON.stringify(data));

async function sendTelegram(text) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
    });
    const j = await r.json();
    if (!j.ok) console.error("Telegram xatosi:", j.description);
  } catch (e) {
    console.error("Telegram xabari yuborilmadi:", e);
  }
}

const inputStyle = {
  width: "100%", background: C.bg, border: "1px solid rgba(243,237,227,0.15)", borderRadius: 8,
  padding: "11px 12px", color: C.cream, fontSize: 14.5, outline: "none", fontFamily: "inherit",
  boxSizing: "border-box",
};
const labelStyle = {
  display: "block", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.08em",
  color: C.dim, marginBottom: 6,
};
const btn = (bg, color, border) => ({
  flex: 1, padding: "12px 0", borderRadius: 8, border: border || "none", background: bg,
  color, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
});

function SectionLabel({ num, title }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
      <span style={{ fontFamily: mono, color: C.gold, fontSize: 13 }}>{num}</span>
      <h2 style={{ fontFamily: serif, fontSize: 19, fontWeight: 700 }}>{title}</h2>
    </div>
  );
}

function Modal({ onClose, title, sub, children }) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(10,9,8,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
    >
      <div style={{ width: "100%", maxWidth: 360, maxHeight: "100%", overflowY: "auto", background: C.card, border: "1px solid rgba(201,162,39,0.35)", borderRadius: 14, padding: "26px 24px 22px", boxSizing: "border-box" }}>
        <h3 style={{ fontFamily: serif, fontSize: 20, marginBottom: 4 }}>{title}</h3>
        <div style={{ fontFamily: mono, fontSize: 13, color: C.goldB, marginBottom: 20 }}>{sub}</div>
        {children}
      </div>
    </div>
  );
}

export default function BarberNavbar() {
  const dates = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(t);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const [date, setDate] = useState(dates[0]);
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: "book" | "cancel" | "unblockDay", time }
  const [ism, setIsm] = useState("");
  const [tel, setTel] = useState("");
  const [odamSoni, setOdamSoni] = useState(1);
  const [customTime, setCustomTime] = useState("");
  const [svc, setSvc] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadDay(date).then((b) => {
      if (alive) {
        setBookings(b);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, [date]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  const isDayOff = !!bookings["__DAM_OLISH__"];
  const isBarber = digits(tel) === BARBER_PHONE;

  // Standart soatlar va mijozlar o'zi qo'shgan vaqtlarni birlashtirib, tartiblash
  const allTimes = useMemo(() => {
    const defaultTimes = HOURS.map((h) => pad(h) + ":00");
    const bookedTimes = Object.keys(bookings).filter((k) => k !== "__DAM_OLISH__");
    const merged = Array.from(new Set([...defaultTimes, ...bookedTimes]));
    return merged.sort();
  }, [bookings]);

  const dateLabel = `${date.getDate()} ${MON_FULL[date.getMonth()]}`;
  const open = (type, time) => {
    setModal({ type, time });
    setCustomTime(time || "12:30");
    setIsm(""); setTel(""); setOdamSoni(1); setSvc(0); setErr("");
  };
  const close = () => setModal(null);

  // Sartarosh butun kunni dam olish kuni qilishi
  async function setDayOff() {
    if (!isBarber) return;
    setBusy(true);
    setErr("");
    try {
      const latest = await loadDay(date);
      latest["__DAM_OLISH__"] = { ts: Date.now() };
      await saveDay(date, latest);
      setBookings(latest);
      setToast(`🛑 ${dateLabel} — Dam olish kuni deb belgilandi!`);
      sendTelegram(`🛑 <b>Dam olish kuni!</b>\n\n📅 Sana: <b>${date.getDate()}-${MON_FULL[date.getMonth()]}</b>\nSartarosh bu kunni dam olish kuni sifatida yopdi.`);
      close();
    } catch (e) {
      setErr("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  // Sartarosh dam olish kunini bekor qilib, kunni qayta ochishi
  async function removeDayOff() {
    if (digits(tel) !== BARBER_PHONE) {
      return setErr("Faqat sartarosh o'z raqami orqali kunni qayta ocha oladi.");
    }
    setBusy(true);
    setErr("");
    try {
      const latest = await loadDay(date);
      delete latest["__DAM_OLISH__"];
      await saveDay(date, latest);
      setBookings(latest);
      setToast(`✅ ${dateLabel} yana ish kuni sifatida ochildi!`);
      sendTelegram(`✅ <b>Kun qayta ochildi!</b>\n\n📅 Sana: <b>${date.getDate()}-${MON_FULL[date.getMonth()]}</b> yana navbat olish uchun ochiq.`);
      close();
    } catch (e) {
      setErr("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  async function book() {
    const finalTime = customTime.trim();
    if (!ism.trim() || !tel.trim()) return setErr("Iltimos, ism va telefon raqamingizni kiriting.");
    if (!finalTime) return setErr("Iltimos, vaqtni tanlang.");
    if (!odamSoni || odamSoni < 1) return setErr("Iltimos, odamlar sonini to'g'ri kiriting.");
    
    setBusy(true);
    setErr("");
    try {
      const latest = await loadDay(date);
      if (latest["__DAM_OLISH__"]) {
        setBookings(latest);
        setErr("Kechirasiz, bu kun dam olish kuni deb belgilangan.");
        return;
      }
      if (latest[finalTime]) {
        setBookings(latest);
        setErr(`Kechirasiz, soat ${finalTime} allaqachon band qilingan. Boshqa vaqt tanlang.`);
        return;
      }
      const s = SERVICES[svc];
      latest[finalTime] = { 
        ism: ism.trim(), 
        tel: tel.trim(), 
        odamSoni: Number(odamSoni),
        xizmat: s.name, 
        ts: Date.now() 
      };
      await saveDay(date, latest);
      setBookings(latest);
      setToast(`Band qilindi! ✂️ ${dateLabel}, soat ${finalTime}`);
      sendTelegram(`✂️ <b>Yangi navbat!</b>\n\n👤 Mijoz: <b>${esc(ism.trim())}</b>\n📞 Telefon: ${esc(tel.trim())}\n👥 Odamlar soni: <b>${odamSoni} kishi</b>\n💈 Xizmat: <b>${esc(s.name)}</b>\n📅 Sana: ${date.getDate()}-${MON_FULL[date.getMonth()]}\n🕐 Vaqt: ${finalTime}`);
      close();
    } catch (e) {
      setErr("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setErr("");
    try {
      const latest = await loadDay(date);
      const b = latest[modal.time];
      if (!b) { setBookings(latest); return close(); }
      const inputDigits = digits(tel);
      if (!inputDigits || (inputDigits !== digits(b.tel) && inputDigits !== BARBER_PHONE)) {
        return setErr("Telefon raqam navbat olgan raqamga mos kelmadi.");
      }
      delete latest[modal.time];
      await saveDay(date, latest);
      setBookings(latest);
      setToast(`Navbat bekor qilindi. ${modal.time} yana bo'sh.`);
      sendTelegram(`❌ <b>Navbat bekor qilindi</b>\n\n👤 Mijoz: <b>${esc(b.ism)}</b>\n📞 Telefon: ${esc(b.tel)}\n📅 Sana: ${date.getDate()}-${MON_FULL[date.getMonth()]}\n🕐 Vaqt: ${modal.time}`);
      close();
    } catch (e) {
      setErr("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ background: C.bg, color: C.cream, minHeight: "100vh", fontFamily: "'Manrope', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');`}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 18px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 22, borderBottom: "1px solid rgba(243,237,227,0.12)", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", border: `1.5px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Scissors size={24} color={C.goldB} strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ fontFamily: serif, fontWeight: 800, fontSize: 26, lineHeight: 1.1 }}>Joxa Barber</h1>
            <p style={{ fontSize: 12.5, color: C.gold, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5, fontWeight: 600 }}>
              Barbershop &middot; Jizzax
            </p>
          </div>
        </div>

        {/* Services */}
        <SectionLabel num="✂" title="Bizning xizmatlar" />
        <div style={{ background: C.card, border: "1px solid rgba(243,237,227,0.1)", borderRadius: 12, padding: "6px 16px", marginBottom: 28 }}>
          {SERVICES.map((s, i) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "12px 0", fontSize: 14.5, borderBottom: i < SERVICES.length - 1 ? "1px dashed rgba(243,237,227,0.14)" : "none" }}>
              <span style={{ fontWeight: 600 }}>{s.name}</span>
              <span style={{ fontSize: 13, color: C.goldB, fontStyle: "italic" }}>{s.desc}</span>
            </div>
          ))}
        </div>

        {/* Date */}
        <SectionLabel num="01" title="Sanani tanlang" />
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 14, marginBottom: 30 }}>
          {dates.map((d) => {
            const on = dateKey(d) === dateKey(date);
            return (
              <div key={dateKey(d)} onClick={() => setDate(d)} style={{ flexShrink: 0, width: 64, padding: "12px 0 10px", textAlign: "center", cursor: "pointer", borderRadius: 10, background: on ? C.gold : C.card, border: `1px solid ${on ? C.gold : "rgba(243,237,227,0.1)"}` }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: on ? "#3a2e08" : C.dim, marginBottom: 4 }}>{DOW[d.getDay()]}</div>
                <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: on ? C.bg : C.cream }}>{d.getDate()}</div>
                <div style={{ fontSize: 10, color: on ? "#3a2e08" : C.dim, marginTop: 2 }}>{MON[d.getMonth()]}</div>
              </div>
            );
          })}
        </div>

        {/* Time */}
        <SectionLabel num="02" title="Vaqtni tanlang" />
        <div style={{ fontFamily: serif, fontSize: 17, color: C.goldB, marginBottom: 16 }}>
          {dateLabel}, {DOW[date.getDay()]}
        </div>

        {/* Agar Dam olish kuni bo'lsa maxsus xabar chiqadi */}
        {!loading && isDayOff ? (
          <div style={{ background: C.redBg, border: `1px solid ${C.redBd}`, borderRadius: 12, padding: "28px 18px", textAlign: "center" }}>
            <div style={{ fontFamily: serif, fontSize: 21, fontWeight: 700, color: "#e3b5ae", marginBottom: 6 }}>
              🛑 Bu kun sartarosh dam oladi, yoki ishi chiqib qolgan bulishi mumkin.
            </div>
            <p style={{ fontSize: 13.5, color: C.dim, marginBottom: 18 }}>
              Iltimos, navbat olish uchun boshqa sanani tanlang.
            </p>
            <button
              onClick={() => open("unblockDay", "")}
              style={{ background: "transparent", border: `1px solid ${C.redBd}`, color: "#e3b5ae", padding: "8px 16px", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
            >
              Sartarosh bo'lsa: kunni qayta ochish
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12 }}>
            {allTimes.map((t) => {
              const booked = !loading && !!bookings[t];
              const free = !loading && !booked;
              return (
                <div
                  key={t}
                  onClick={() => !loading && open(booked ? "cancel" : "book", t)}
                  style={{
                    position: "relative", overflow: "hidden", borderRadius: 10, padding: "16px 6px 12px", textAlign: "center",
                    cursor: loading ? "default" : "pointer",
                    background: loading ? "#2E2B27" : booked ? C.redBg : C.greenBg,
                    border: `1px solid ${loading ? "rgba(243,237,227,0.08)" : booked ? C.redBd : C.greenBd}`,
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: loading ? "transparent" : booked ? C.red : C.green }} />
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: booked ? "#e3b5ae" : C.cream }}>{t}</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 5, fontWeight: 700, color: loading ? C.dim : booked ? C.red : C.green }}>
                    {loading ? "..." : free ? "Bo'sh" : "Band"}
                  </div>
                </div>
              );
            })}

            {/* Mijoz o'zi vaqt qo'shishi uchun tugma */}
            {!loading && (
              <div
                onClick={() => open("book", "")}
                style={{
                  position: "relative", overflow: "hidden", borderRadius: 10, padding: "16px 6px 12px", textAlign: "center",
                  cursor: "pointer", background: "rgba(201,162,39,0.08)", border: `1px dashed ${C.gold}`,
                }}
              >
                <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: C.goldB }}>+ Vaqt</div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 5, fontWeight: 700, color: C.gold }}>
                  Tanlash
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(243,237,227,0.1)", fontSize: 12.5, color: C.dim }}>
          {[[C.green, "Bo'sh vaqt"], [C.red, "Band qilingan (bosib bekor qilish mumkin)"], [C.gold, "O'zingizga qulay boshqa vaqt tanlash"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
              {l}
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40, fontSize: 11.5, color: "rgba(243,237,227,0.3)" }}>Joxa Barber &middot; Jizzax</div>
      </div>

      {/* Book modal */}
      {modal?.type === "book" && (
        <Modal onClose={close} title="Navbatni tasdiqlash" sub={`${dateLabel} — ${customTime || "Vaqtni tanlang"}`}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Ismingiz</label>
            <input style={inputStyle} value={ism} onChange={(e) => setIsm(e.target.value)} placeholder="Masalan: Aziz" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Telefon raqamingiz</label>
            <input style={inputStyle} type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+998 90 123 45 67" />
          </div>

          {/* Agar sartarosh o'z raqamini kiritsa, butun kunni dam olish kuni qilish tugmasi chiqadi */}
          {isBarber && (
            <div style={{ background: C.redBg, border: `1px solid ${C.redBd}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12.5, color: "#e3b5ae", marginBottom: 8, fontWeight: 600 }}>
                ✂️ Sartarosh rejimi aniqlandi
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={setDayOff}
                style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: C.red, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              >
                🛑 Shu kunni Dam olish kuni qilish (Yopish)
              </button>
            </div>
          )}

          {/* Vaqt va Odam soni */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Kelish vaqti</label>
              <input
                style={{ ...inputStyle, colorScheme: "dark" }}
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nechta odam?</label>
              <input
                style={inputStyle}
                type="number"
                min="1"
                max="10"
                value={odamSoni}
                onChange={(e) => setOdamSoni(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <label style={labelStyle}>Xizmat turi</label>
          {SERVICES.map((s, i) => (
            <div key={s.name} onClick={() => setSvc(i)} style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 8, cursor: "pointer", border: `1px solid ${i === svc ? C.gold : "rgba(243,237,227,0.15)"}`, background: i === svc ? "rgba(201,162,39,0.1)" : "transparent" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.cream }}>{s.name}</div>
              <div style={{ fontSize: 12, color: C.goldB, marginTop: 3 }}>{s.desc}</div>
            </div>
          ))}
          {err && <div style={{ color: "#e07a6c", fontSize: 12.5, marginTop: 10 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btn("transparent", C.dim, "1px solid rgba(243,237,227,0.2)")} onClick={close}>Bekor qilish</button>
            <button style={{ ...btn(C.gold, "#241c04"), opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={book}>
              {busy ? "Yuborilmoqda..." : "Tasdiqlash"}
            </button>
          </div>
        </Modal>
      )}

      {/* Cancel modal */}
      {modal?.type === "cancel" && (
        <Modal onClose={close} title="Bu vaqt band" sub={`${dateLabel} — ${modal.time}`}>
          <label style={labelStyle}>Navbatni bekor qilish uchun telefon raqamingiz</label>
          <input style={inputStyle} type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+998 90 123 45 67" />
          {err && <div style={{ color: "#e07a6c", fontSize: 12.5, marginTop: 10 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btn("transparent", C.dim, "1px solid rgba(243,237,227,0.2)")} onClick={close}>Yopish</button>
            <button style={{ ...btn(C.red, "#fff"), opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={cancel}>
              Bekor qilish
            </button>
          </div>
        </Modal>
      )}

      {/* Dam olish kunini qayta ochish modali */}
      {modal?.type === "unblockDay" && (
        <Modal onClose={close} title="Kunni qayta ochish" sub={dateLabel}>
          <label style={labelStyle}>Sartarosh telefon raqamini kiriting</label>
          <input style={inputStyle} type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="+998 __ ___ __ __" />
          {err && <div style={{ color: "#e07a6c", fontSize: 12.5, marginTop: 10 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={btn("transparent", C.dim, "1px solid rgba(243,237,227,0.2)")} onClick={close}>Yopish</button>
            <button style={{ ...btn(C.green, "#fff"), opacity: busy ? 0.5 : 1 }} disabled={busy} onClick={removeDayOff}>
              Kunni ochish
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: `translateX(-50%) translateY(${toast ? 0 : 20}px)`, opacity: toast ? 1 : 0, transition: "all .25s ease", pointerEvents: "none", zIndex: 60, background: C.green, color: "#fff", padding: "14px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, textAlign: "center", maxWidth: "90vw", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
        {toast}
      </div>
    </div>
  );
}