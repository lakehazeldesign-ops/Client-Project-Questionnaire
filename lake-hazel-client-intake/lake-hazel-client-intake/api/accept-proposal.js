export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  if (!process.env.CLICKUP_API_TOKEN) {
    return res.status(500).json({
      error: "CLICKUP_API_TOKEN is not configured"
    });
  }

  const {
    taskId,
    clientName,
    clientEmail,
    proposalTitle,
    proposalAmount,
    proposalScope,
    acceptedAt
  } = req.body || {};

  if (!taskId) {
    return res.status(400).json({
      error: "Missing ClickUp task ID"
    });
  }

  const comment = `
✅ PROPOSAL ACCEPTED

Client: ${clientName || ""}
Email: ${clientEmail || ""}
Proposal: ${proposalTitle || ""}
Amount: ${proposalAmount || ""}
Accepted At: ${acceptedAt || new Date().toISOString()}

Scope:
${proposalScope || ""}
  `.trim();

  try {

    const clickupResponse = await fetch(
      `https://api.clickup.com/api/v2/task/${taskId}/comment`,
      {
        method: "POST",
        headers: {
          Authorization: process.env.CLICKUP_API_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          comment_text: comment,
          notify_all: false
        })
      }
    );

    const data = await clickupResponse.json();

    if (!clickupResponse.ok) {
      console.error("ClickUp error:", data);

      return res.status(clickupResponse.status).json({
        error: "ClickUp rejected the approval",
        detail: data
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Proposal accepted"
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Server error"
    });

  }
}
