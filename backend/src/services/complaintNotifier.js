import Complaint from "../models/complaintModel.js";
import { sendMail } from "../utils/mailer.js";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatIST = (date) =>
  new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

const buildEmail = (complaint) => {
  const student = complaint.studentId;
  const user = student?.userId;

  const rows = [
    ["Complaint No", complaint.complaintNo],
    ["Category", complaint.category],
    ["Severity", complaint.severity],
    ["Submitted", `${formatIST(complaint.createdAt)} (IST)`],
    ["Student", user?.name || "—"],
    ["SBU ID", student?.sbuId || "—"],
    ["Course / Year", `${student?.course || "—"} / ${student?.year || "—"}`],
    [
      "Hostel / Room",
      `${student?.hostelId?.name || "—"} / ${student?.roomId?.roomNumber || "—"}`,
    ],
    ["Phone", user?.phone || "—"],
    ["Email", user?.email || "—"],
    ["Also sent to", complaint.sentTo.filter((r) => r !== "DSW").join(", ") || "—"],
  ];

  const subject = `[SBHMS] ${complaint.severity} ${complaint.category} complaint - ${complaint.complaintNo}`;

  const text = [
    "A new complaint has been submitted through the SBHMS hostel portal.",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Title: ${complaint.title}`,
    "",
    "Details:",
    complaint.description,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#0f172a">
      <h2 style="margin:0 0 4px">New hostel complaint</h2>
      <p style="margin:0 0 16px;color:#64748b">Submitted through the SBHMS hostel portal</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;width:150px"><b>${escapeHtml(label)}</b></td>
            <td style="padding:6px 10px;border:1px solid #e2e8f0">${escapeHtml(value)}</td>
          </tr>`
          )
          .join("")}
      </table>
      <h3 style="margin:20px 0 6px">${escapeHtml(complaint.title)}</h3>
      <p style="white-space:pre-wrap;line-height:1.5;margin:0">${escapeHtml(complaint.description)}</p>
    </div>`;

  return { subject, text, html, replyTo: user?.email };
};

/*
  Emails a complaint to the DSW and records the result on the complaint
  (so the student can see "sent" or "failed").
  Never throws - email problems must not break the complaint itself.
*/
export const notifyDsw = async (complaintId) => {
  let currentStatus = "PENDING";

  try {
    const complaint = await Complaint.findById(complaintId).populate({
      path: "studentId",
      select: "sbuId course year hostelId roomId userId",
      populate: [
        { path: "userId", select: "name email phone" },
        { path: "hostelId", select: "name" },
        { path: "roomId", select: "roomNumber" },
      ],
    });

    if (!complaint || !complaint.sentTo.includes("DSW")) return;

    currentStatus = complaint.status;

    const to = process.env.DSW_EMAIL;

    if (!to) {
      throw new Error("DSW_EMAIL is not set in .env");
    }

    const { subject, text, html, replyTo } = buildEmail(complaint);

    await sendMail({ to, subject, text, html, replyTo });

    await Complaint.updateOne(
      { _id: complaintId },
      {
        $set: {
          "dswEmail.status": "SENT",
          "dswEmail.sentAt": new Date(),
        },
        $unset: {
          "dswEmail.error": "",
        },
        $push: {
          timeline: {
            action: "DSW_EMAILED",
            status: complaint.status,
            note: "Complaint was emailed to the DSW",
            byRole: "SYSTEM",
          },
        },
      }
    );
  } catch (error) {
    console.error("DSW email error:", error.message);

    await Complaint.updateOne(
      { _id: complaintId },
      {
        $set: {
          "dswEmail.status": "FAILED",
          "dswEmail.error": String(error.message).slice(0, 200),
        },
        $push: {
          timeline: {
            action: "DSW_EMAIL_FAILED",
            status: currentStatus,
            note: "Email to the DSW could not be sent. You can retry.",
            byRole: "SYSTEM",
          },
        },
      }
    ).catch((updateError) =>
      console.error("Could not record DSW email failure:", updateError.message)
    );
  }
};