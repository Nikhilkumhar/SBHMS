/*
  Email sender.

  Two ways to send (the first one that is configured is used):

  1) Brevo HTTPS API  -> use this on free hosts (Render free blocks SMTP).
       BREVO_API_KEY=xkeysib-...
       MAIL_FROM="SBHMS <your-verified-sender@gmail.com>"
       DSW_EMAIL=dsw@college.edu            (comma-separate for several)

  2) SMTP (nodemailer) -> fine on your own computer.
       SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM (optional)

  Both are only read when an email is actually sent, so dotenv has
  already loaded the values by then.
*/

let transporter = null;

// "Name <a@b.com>"  or  "a@b.com"  ->  { name, email }
const parseAddress = (value = "") => {
  const text = String(value).trim();
  const match = text.match(/^(.*?)\s*<([^>]+)>$/);

  if (match) {
    return { name: match[1].replace(/^"|"$/g, "").trim(), email: match[2].trim() };
  }

  return { email: text };
};

// "a@b.com, c@d.com"  or  ["a@b.com"]  ->  [{ email }, { email }]
const parseRecipients = (to) =>
  (Array.isArray(to) ? to : String(to || "").split(/[,;]/))
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((email) => ({ email }));

/* ------------------ Brevo (HTTPS) ------------------ */

const sendWithBrevo = async ({ to, subject, text, html, replyTo }) => {
  const sender = parseAddress(process.env.MAIL_FROM || process.env.SMTP_USER);

  if (!sender.email) {
    throw new Error("MAIL_FROM is not set (needs a sender verified in Brevo)");
  }

  const recipients = parseRecipients(to);

  if (recipients.length === 0) {
    throw new Error("No email recipient");
  }

  const body = {
    sender: sender.name ? sender : { email: sender.email, name: "SBHMS" },
    to: recipients,
    subject,
    htmlContent: html,
    textContent: text,
  };

  if (replyTo) {
    body.replyTo = { email: replyTo };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = "";

      try {
        const data = await response.json();
        detail = data.message || "";
      } catch {
        // No JSON body. Ignore.
      }

      throw new Error(
        `Brevo error ${response.status}${detail ? `: ${detail}` : ""}`
      );
    }

    return response.json().catch(() => ({}));
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Brevo request timed out");
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
};

/* ------------------ SMTP (local computer) ------------------ */

const sendWithSmtp = async ({ to, subject, text, html, replyTo }) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Email is not configured (set BREVO_API_KEY, or the SMTP settings)"
    );
  }

  if (!transporter) {
    const { default: nodemailer } = await import("nodemailer");
    const port = Number(SMTP_PORT) || 587;

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM || SMTP_USER,
    to,
    subject,
    text,
    html,
    replyTo,
  });
};

/* ------------------ public function ------------------ */

export const sendMail = async (message) => {
  if (process.env.BREVO_API_KEY) {
    return sendWithBrevo(message);
  }

  return sendWithSmtp(message);
};