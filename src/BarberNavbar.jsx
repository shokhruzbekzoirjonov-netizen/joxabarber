import { useState, useEffect, useMemo, useCallback } from "react";
import { Scissors } from "lucide-react";

const TELEGRAM_BOT_TOKEN = "8952129410:AAGCxdTKV9F9_Vb40vftG1qCSULsVBPiOMc";
const TELEGRAM_CHAT_ID = "-5012396870";

const DOW = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const MON = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
const MON_FULL = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
const SLOT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const COLOR = {
  charcoal: "#1C1B1A",
  charcoal2: "#242220",
  charcoal3: "#2E2B27",
  cream: "#F3EDE3",
  creamDim: "#c9c2b4",
  gold: "#C9A227",
  goldBright: "#E4BE3F",
  green: "#3F7A5B",
  greenBg: "rgba(63,122,91,0.14)",
  greenBorder: "rgba(63,122,91,0.55)",
  red: "#A6453A",
  redBg: "rgba(166,69,58,0.14)",
  redBorder: "rgba(166,69,58,0.55)",
};

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}
function dateKey(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

async function sendTelegramNotification(text) {
  try {
    const resp = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
    const data = await resp.json();
    if (!data.ok) console.error("Telegram xatosi:", data.description);
  } catch (e) {
    console.error("Telegram xabari yuborilmadi:", e);
  }
}

export default function BarberNavbar() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [bookings, setBookings] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [ism, setIsm] = useState("");
  const [tel, setTel] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ show: false, text: "" });

  const loadBookings = useCallback((date) => {
    setLoadingSlots(true);
    const key = "band-" + dateKey(date);
    try {
      const result = localStorage.getItem(key);
      setBookings(result ? JSON.parse(result) : {});
    } catch (e) {
      setBookings({});
    }
    setLoadingSlots(false);
  }, []);

  useEffect(() => {
    loadBookings(selectedDate);
  }, [selectedDate, loadBookings]);

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast({ show: false, text: "" }), 3800);
    return () => clearTimeout(t);
  }, [toast.show]);

  function openModal(timeStr) {
    setSelectedTime(timeStr);
    setIsm("");
    setTel("");
    setErrMsg("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedTime(null);
  }

  async function handleConfirm() {
    const ismVal = ism.trim();
    const telVal = tel.trim();

    if (!ismVal || !telVal) {
      setErrMsg("Iltimos, ism va telefon raqamingizni kiriting.");
      return;
    }

    setSubmitting(true);
    setErrMsg("");
    const key = "band-" + dateKey(selectedDate);

    try {
      let latest = {};
      try {
        const result = localStorage.getItem(key);
        latest = result ? JSON.parse(result) : {};
      } catch (e) {
        latest = {};
      }

      if (latest[selectedTime]) {
        setErrMsg("Kechirasiz, bu vaqt hozirgina band qilindi. Boshqa vaqtni tanlang.");
        setBookings(latest);
        setSubmitting(false);
        return;
      }

      latest[selectedTime] = { ism: ismVal, tel: telVal, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(latest));
      setBookings(latest);
      closeModal();
      setToast({
        show: true,
        text: `Band qilindi! ✂️ ${selectedDate.getDate()} ${MON_FULL[selectedDate.getMonth()]}, soat ${selectedTime}`,
      });

      const sana = `${selectedDate.getDate()}-${MON_FULL[selectedDate.getMonth()]}`;
      const notifText = `✂️ <b>Yangi navbat!</b>\n\n👤 Mijoz: <b>${ismVal}</b>\n📞 Telefon: ${telVal}\n📅 Sana: ${sana}\n🕐 Vaqt: ${selectedTime}`;
      sendTelegramNotification(notifText);
    } catch (e) {
      setErrMsg("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: COLOR.charcoal, color: COLOR.cream, minHeight: "100vh", fontFamily: "'Manrope', sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Manrope:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        .bn-scroll::-webkit-scrollbar{ height:5px; }
        .bn-scroll::-webkit-scrollbar-thumb{ background:rgba(243,237,227,0.15); border-radius:10px; }
        .bn-slot:hover.bn-available{ transform:translateY(-2px); filter:brightness(1.15); }
        .bn-btn:hover{ filter:brightness(1.1); }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 18px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 22, borderBottom: "1px solid rgba(243,237,227,0.12)", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", border: `1.5px solid ${COLOR.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Scissors size={24} color={COLOR.goldBright} strokeWidth={1.8} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 26, letterSpacing: "0.02em", lineHeight: 1.1, color: COLOR.cream }}>
              Javohir Barber
            </h1>
            <p style={{ fontSize: 12.5, color: COLOR.gold, letterSpacing: "0.16em", textTransform: "uppercase", marginTop: 5, fontWeight: 600 }}>
              Barbershop &middot; Jizzax
            </p>
          </div>
        </div>

        {/* Date section */}
        <SectionLabel num="01" title="Sanani tanlang" />
        <div className="bn-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 14, marginBottom: 30 }}>
          {dates.map((d) => {
            const active = dateKey(d) === dateKey(selectedDate);
            return (
              <div
                key={dateKey(d)}
                onClick={() => setSelectedDate(d)}
                style={{
                  flexShrink: 0,
                  width: 64,
                  padding: "12px 0 10px",
                  background: active ? COLOR.gold : COLOR.charcoal2,
                  border: `1px solid ${active ? COLOR.gold : "rgba(243,237,227,0.1)"}`,
                  borderRadius: 10,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: active ? "#3a2e08" : COLOR.creamDim, marginBottom: 4 }}>
                  {DOW[d.getDay()]}
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: active ? "#1C1B1A" : COLOR.cream }}>
                  {d.getDate()}
                </div>
                <div style={{ fontSize: 10, color: active ? "#3a2e08" : COLOR.creamDim, marginTop: 2 }}>
                  {MON[d.getMonth()]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time section */}
        <SectionLabel num="02" title="Vaqtni tanlang" />
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: COLOR.goldBright, marginBottom: 16 }}>
          {selectedDate.getDate()} {MON_FULL[selectedDate.getMonth()]}, {DOW[selectedDate.getDay()]}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 12 }}>
          {SLOT_HOURS.map((h) => {
            const timeStr = pad(h) + ":00";
            const booked = !loadingSlots && bookings[timeStr];
            const isLoading = loadingSlots;
            return (
              <div
                key={timeStr}
                className={`bn-slot ${!isLoading && !booked ? "bn-available" : ""}`}
                onClick={() => !isLoading && !booked && openModal(timeStr)}
                style={{
                  position: "relative",
                  borderRadius: 10,
                  padding: "16px 6px 12px",
                  textAlign: "center",
                  cursor: isLoading ? "default" : booked ? "not-allowed" : "pointer",
                  border: `1px solid ${isLoading ? "rgba(243,237,227,0.08)" : booked ? COLOR.redBorder : COLOR.greenBorder}`,
                  background: isLoading ? COLOR.charcoal3 : booked ? COLOR.redBg : COLOR.greenBg,
                  overflow: "hidden",
                  transition: "transform 0.12s ease, filter 0.12s ease",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: isLoading ? "transparent" : booked ? COLOR.red : COLOR.green }} />
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: booked ? "#e3b5ae" : COLOR.cream }}>
                  {timeStr}
                </div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 5, fontWeight: 700, color: isLoading ? COLOR.creamDim : booked ? COLOR.red : COLOR.green }}>
                  {isLoading ? "..." : booked ? "Band" : "Bo'sh"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(243,237,227,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: COLOR.creamDim }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLOR.green, display: "inline-block" }} />
            Bo'sh vaqt
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: COLOR.creamDim }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: COLOR.red, display: "inline-block" }} />
            Band qilingan
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 40, fontSize: 11.5, color: "rgba(243,237,227,0.3)", letterSpacing: "0.04em" }}>
          Javohir Barber &middot; Jizzax
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          style={{ position: "fixed", inset: 0, background: "rgba(10,9,8,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}
        >
          <div style={{ width: "100%", maxWidth: 360, background: COLOR.charcoal2, border: "1px solid rgba(201,162,39,0.35)", borderRadius: 14, padding: "26px 24px 22px", position: "relative" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: COLOR.cream, marginBottom: 4 }}>
              Navbatni tasdiqlash
            </h3>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: COLOR.goldBright, marginBottom: 26 }}>
              {selectedDate.getDate()} {MON_FULL[selectedDate.getMonth()]} — {selectedTime}
            </div>

            <div style={{ marginTop: 16, marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.08em", color: COLOR.creamDim, marginBottom: 6 }}>
                Ismingiz
              </label>
              <input
                type="text"
                value={ism}
                onChange={(e) => setIsm(e.target.value)}
                placeholder="Masalan: Aziz"
                style={{ width: "100%", background: COLOR.charcoal, border: "1px solid rgba(243,237,227,0.15)", borderRadius: 8, padding: "11px 12px", color: COLOR.cream, fontFamily: "'Manrope', sans-serif", fontSize: 14.5, outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.08em", color: COLOR.creamDim, marginBottom: 6 }}>
                Telefon raqamingiz
              </label>
              <input
                type="tel"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                placeholder="+998 90 123 45 67"
                style={{ width: "100%", background: COLOR.charcoal, border: "1px solid rgba(243,237,227,0.15)", borderRadius: 8, padding: "11px 12px", color: COLOR.cream, fontFamily: "'Manrope', sans-serif", fontSize: 14.5, outline: "none" }}
              />
            </div>

            {errMsg && <div style={{ color: "#e07a6c", fontSize: 12.5, marginTop: 10 }}>{errMsg}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button
                className="bn-btn"
                onClick={closeModal}
                style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "1px solid rgba(243,237,227,0.2)", background: "transparent", color: COLOR.creamDim, fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Bekor qilish
              </button>
              <button
                className="bn-btn"
                onClick={handleConfirm}
                disabled={submitting}
                style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "none", background: COLOR.gold, color: "#241c04", fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.5 : 1 }}
              >
                {submitting ? "Yuborilmoqda..." : "Tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`,
          background: COLOR.green,
          color: "#fff",
          padding: "14px 22px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          opacity: toast.show ? 1 : 0,
          pointerEvents: "none",
          transition: "all 0.25s ease",
          zIndex: 60,
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          textAlign: "center",
          maxWidth: "90vw",
        }}
      >
        {toast.text}
      </div>
    </div>
  );
}

function SectionLabel({ num, title }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
      <span style={{ fontFamily: "'Space Mono', monospace", color: COLOR.gold, fontSize: 13 }}>{num}</span>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: COLOR.cream }}>{title}</h2>
    </div>
  );
}