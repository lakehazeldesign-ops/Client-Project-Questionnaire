// Lake Hazel Design website lead inquiry -> ClickUp
// Destination: Sales > Lead Management > All Leads & Inquiries
const CLICKUP_LIST_ID = '901417214869';

function clean(value) {
  return (value ?? '').toString().trim();
}

function line(label, value) {
  return `**${label}:** ${clean(value)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.CLICKUP_API_TOKEN) {
    return res.status(500).json({ error: 'CLICKUP_API_TOKEN is not configured' });
  }

  const body = req.body || {};
  const required = [
    'name',
    'email',
    'phone',
    'cityState',
    'projectType',
    'estimatedBudget',
    'desiredStartDate',
    'projectDetails',
    'leadSource',
  ];

  if (required.some((field) => !clean(body[field]))) {
    return res.status(400).json({ error: 'Please complete every field.' });
  }

  const description = [
    '## Contact Information',
    '',
    line('Name', body.name),
    '',
    line('Email', body.email),
    '',
    line('Phone', body.phone),
    '',
    line('City / State', body.cityState),
    '',
    '## Project Information',
    '',
    line('Project Type', body.projectType),
    '',
    line('Estimated Budget', body.estimatedBudget),
    '',
    line('Desired Start Date', body.desiredStartDate),
    '',
    line('How They Heard About Lake Hazel Design', body.leadSource),
    '',
    '## Project Details',
    '',
    clean(body.projectDetails),
  ].join('\n');

  const clickupResponse = await fetch(
    `https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task`,
    {
      method: 'POST',
      headers: {
        Authorization: process.env.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${clean(body.name)} — ${clean(body.projectType)}`,
        markdown_description: description,
        status: 'new inquiry',
      }),
    }
  );

  const data = await clickupResponse.json().catch(() => ({}));
  if (!clickupResponse.ok) {
    console.error('ClickUp error:', data);
    return res.status(clickupResponse.status).json({
      error: 'We could not send your inquiry. Please try again.',
    });
  }

  return res.status(200).json({ ok: true });
}
