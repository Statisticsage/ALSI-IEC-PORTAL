import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getMaintenanceInfo() {
  const { data } = await supabase
    .from("system_config")
    .select("key, value")
    .in("key", ["maintenance_message", "maintenance_end"]);

  const map: Record<string, string> = {};
  data?.forEach(row => { map[row.key] = row.value; });
  return map;
}

export default async function MaintenancePage() {
  const config = await getMaintenanceInfo();

  const endTime = config.maintenance_end
    ? new Date(config.maintenance_end).toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
        hour12: true,
      }).toUpperCase()
    : "8:30 PM";

  const endDate = config.maintenance_end
    ? new Date(config.maintenance_end).toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata",
      })
    : "12 May 2026";

  return (
    <html lang="en">
      <head>
        <title>Portal Under Maintenance — IEC ALSI 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            padding: 56px 48px;
            max-width: 580px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          }
          .seal {
            width: 72px;
            height: 72px;
            background: #0B1F3A;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
          }
          .seal svg { width: 36px; height: 36px; color: white; }
          .tag {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 4px 14px;
            margin-bottom: 20px;
          }
          h1 {
            font-size: 26px;
            font-weight: 800;
            color: #0B1F3A;
            line-height: 1.3;
            margin-bottom: 16px;
          }
          .body-text {
            font-size: 15px;
            color: #64748b;
            line-height: 1.75;
            margin-bottom: 32px;
          }
          .time-box {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 20px 24px;
            margin-bottom: 32px;
          }
          .time-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #94a3b8;
            margin-bottom: 6px;
          }
          .time-value {
            font-size: 22px;
            font-weight: 800;
            color: #0B1F3A;
          }
          .time-date {
            font-size: 13px;
            color: #64748b;
            margin-top: 2px;
          }
          .divider {
            border: none;
            border-top: 1px solid #f1f5f9;
            margin: 0 0 24px;
          }
          .footer-text {
            font-size: 12px;
            color: #94a3b8;
            line-height: 1.6;
          }
          .footer-text strong { color: #64748b; }
          @media (max-width: 480px) {
            .card { padding: 40px 24px; }
            h1 { font-size: 22px; }
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          {/* SEAL */}
          <div className="seal">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>

          <div className="tag">Scheduled Maintenance</div>

          <h1>Portal Temporarily Unavailable</h1>

          <p className="body-text">
            {config.maintenance_message ||
              "The IEC Digital Registration Portal is currently undergoing scheduled maintenance as directed by the Independent Elections Commission. We apologize for any inconvenience."}
          </p>

          {/* REOPEN TIME */}
          <div className="time-box">
            <p className="time-label">Portal reopens at</p>
            <p className="time-value">{endTime} IST</p>
            <p className="time-date">{endDate}</p>
          </div>

          <hr className="divider" />

          <p className="footer-text">
            <strong>For urgent matters,</strong> contact the IEC directly at{" "}
            <strong>alsiiec048@gmail.com</strong>
            <br /><br />
            This maintenance period has been authorized by the<br />
            <strong>Independent Elections Commission (IEC)</strong><br />
            Association of Liberian Students in India — 2026/2027 General Elections
          </p>
        </div>
      </body>
    </html>
  );
}