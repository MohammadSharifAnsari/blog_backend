/**
 * buildContactConfirmationHTML(name, email)
 * Returns an HTML string confirming receipt of a contact form.
 *
 * Parameters:
 *  - name  : string | null  -> user's name (shown as "Friend" when missing)
 *  - email : string | null  -> user's email (hidden if missing)
 *
 * The function escapes the input to avoid HTML injection/XSS.
 */
function buildContactConfirmationHTML(name, email) {
  // Simple HTML-escape to prevent injection
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  const safeName = escapeHtml(name) || "Friend";
  const safeEmail = escapeHtml(email || "");

  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Contact Received</title>
    <style>
      /* Basic reset */
      html,body{margin:0;padding:0;height:100%}
      body{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        background: linear-gradient(180deg,#f6fbff 0%, #ffffff 100%);
        color:#0f172a;
        -webkit-font-smoothing:antialiased;
        -moz-osx-font-smoothing:grayscale;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:24px;
        box-sizing:border-box;
      }

      .card{
        width:100%;
        max-width:660px;
        background:#ffffff;
        border-radius:14px;
        box-shadow: 0 6px 28px rgba(15,23,42,0.08);
        padding:28px;
        box-sizing:border-box;
        display:flex;
        gap:18px;
        align-items:center;
      }

      .icon-wrap{
        flex: 0 0 72px;
        height:72px;
        border-radius:12px;
        background: linear-gradient(135deg,#00c853, #00bfa5);
        display:flex;
        align-items:center;
        justify-content:center;
        color:white;
        box-shadow: 0 6px 18px rgba(0,0,0,0.06);
      }

      .content{
        flex:1 1 auto;
      }

      h1{
        font-size:20px;
        margin:0 0 6px 0;
        line-height:1.15;
      }

      p{
        margin:0;
        color:#334155;
        font-size:14px;
        line-height:1.5;
      }

      .meta{
        margin-top:12px;
        display:flex;
        gap:10px;
        flex-wrap:wrap;
      }

      .pill{
        background:#f1f5f9;
        color:#0f172a;
        padding:8px 12px;
        border-radius:999px;
        font-size:13px;
        display:inline-flex;
        align-items:center;
      }

      .cta{
        margin-top:16px;
      }

      .btn{
        display:inline-block;
        background:#0ea5a5;
        color:white;
        text-decoration:none;
        padding:10px 14px;
        border-radius:10px;
        font-weight:600;
        font-size:14px;
      }

      /* mobile */
      @media (max-width:520px){
        .card{padding:18px; gap:12px}
        .icon-wrap{flex-basis:56px;height:56px}
        h1{font-size:18px}
      }
    </style>
  </head>
  <body>
    <div class="card" role="status" aria-live="polite">
      <div class="icon-wrap" aria-hidden="true">
        <!-- check icon -->
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="content">
        <h1>Contact message received — thank you, ${safeName}!</h1>
        <p>We have recorded your message and will get back to you as soon as possible.</p>

        <div class="meta" aria-hidden="${safeEmail ? "false" : "true"}">
          ${safeEmail ? `<span class="pill">Email: <strong style="margin-left:8px">${safeEmail}</strong></span>` : ""}
          <span class="pill">Reference: <strong style="margin-left:8px">#${Math.random().toString(36).slice(2,9).toUpperCase()}</strong></span>
        </div>

        <div class="cta">
          ${safeEmail ? `<a class="btn" href="mailto:${safeEmail}">Reply to ${safeName}</a>` : `<a class="btn" href="#" onclick="return false">OK</a>`}
        </div>
        <p style="margin-top:12px;color:#64748b;font-size:13px">
          If you don’t see a reply within 48 hours, please check your spam folder or contact us again.
        </p>
      </div>
    </div>
  </body>
  </html>`;
}

export default buildContactConfirmationHTML;