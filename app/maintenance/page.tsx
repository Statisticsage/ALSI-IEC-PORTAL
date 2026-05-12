export default function MaintenancePage() {
  return (
    <html lang="en">
      <head>
        <title>Portal Under Maintenance — IEC ALSI 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "56px 48px", maxWidth: "580px", width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", margin: "24px" }}>

          {/* SEAL */}
          <div style={{ width: 72, height: 72, background: "#0B1F3A", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>

          {/* BADGE */}
          <div style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 14px", marginBottom: 20 }}>
            Official Notice — Scheduled Maintenance
          </div>

          {/* TITLE */}
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0B1F3A", lineHeight: 1.3, marginBottom: 16 }}>
            Portal Temporarily Unavailable
          </h1>

          {/* MESSAGE */}
          <p style={{ fontSize: 15, color: "#475569", lineHeight: 1.8, marginBottom: 32 }}>
            The IEC Digital Registration Portal is currently undergoing a scheduled
            maintenance period as officially directed by the Independent Elections
            Commission (IEC). All registration services are temporarily suspended.
          </p>

          {/* REOPEN TIME BOX */}
          <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 14, padding: "20px 24px", marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", marginBottom: 6 }}>
              Portal Reopens At
            </p>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#0B1F3A", marginBottom: 4 }}>
              8:30 PM IST
            </p>
            <p style={{ fontSize: 13, color: "#64748b" }}>
              Tuesday, 12 May 2026
            </p>
          </div>

          {/* WHAT TO DO */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              What you should do
            </p>
            <ul style={{ fontSize: 13, color: "#374151", lineHeight: 2, paddingLeft: 16, margin: 0 }}>
              <li>Please return after <strong>8:30 PM IST</strong> to complete your registration</li>
              <li>Your partially filled form data has not been lost</li>
              <li>Registration deadline remains <strong>18 May 2026</strong></li>
            </ul>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", marginBottom: 24 }} />

          {/* FOOTER */}
          <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.8 }}>
            For urgent matters, contact the IEC at{" "}
            <strong style={{ color: "#64748b" }}>alsiiec048@gmail.com</strong>
            <br />
            <strong style={{ color: "#64748b" }}>Independent Elections Commission (IEC)</strong>
            <br />
            Association of Liberian Students in India — General Elections 2026/2027
          </p>
        </div>
      </body>
    </html>
  );
}