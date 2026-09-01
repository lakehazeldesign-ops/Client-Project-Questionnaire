// Lake Hazel Design Client Project Questionnaire -> ClickUp
// Destination: LH Design > Designer Client Onboarding
const CLICKUP_LIST_ID = '901418740109';
const CLICKUP_LEAD_LIST_ID = '901417214869';

function clean(v){if(Array.isArray(v))return v.filter(Boolean).join(', ');return (v??'').toString().trim();}
function section(title,rows){const body=rows.filter(([,v])=>clean(v)).map(([k,v])=>`**${k}:** ${clean(v)}`).join('\n\n');return body?`## ${title}\n\n${body}`:'';}

async function clickup(path, init = {}) {
  return fetch(`https://api.clickup.com/api/v2${path}`, {
    ...init,
    headers: {
      Authorization: process.env.CLICKUP_API_TOKEN,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

async function findLeadByEmail(email) {
  const target = clean(email).toLowerCase();
  if (!target) return null;

  // Search the three most recent pages so an older active lead can still match.
  for (let page = 0; page < 3; page += 1) {
    const response = await clickup(
      `/list/${CLICKUP_LEAD_LIST_ID}/task?include_closed=true&subtasks=true&page=${page}`
    );
    if (!response.ok) throw new Error(`ClickUp lead search failed: ${response.status}`);

    const data = await response.json();
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const match = tasks.find((task) => {
      const searchable = [task.name, task.description, task.text_content]
        .filter(Boolean)
        .join('\n')
        .toLowerCase();
      return searchable.includes(target);
    });

    if (match) return match;
    if (tasks.length < 100) break;
  }

  return null;
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS')return res.status(204).end();if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(!process.env.CLICKUP_API_TOKEN)return res.status(500).json({error:'CLICKUP_API_TOKEN is not configured'});
  const b=req.body||{};if(!b.firstName||!b.lastName||!b.email||!b.phone||!b.address||!b.projectType)return res.status(400).json({error:'Required intake fields are missing'});
  const taskName=`${clean(b.firstName)} ${clean(b.lastName)} — ${clean(b.projectType)}${b.city?` — ${clean(b.city)}`:''}`;
  const files=Array.isArray(b.projectFiles)?b.projectFiles.slice(0,10):[];
  let connectedLead = null;
  try {
    connectedLead = await findLeadByEmail(b.email);
  } catch (error) {
    // Never block a questionnaire if the lead lookup is temporarily unavailable.
    console.error('Lead matching error:', error);
  }
  const description=[
    connectedLead ? section('Connected Lead Inquiry', [['Lead Task', connectedLead.url || `https://app.clickup.com/t/${connectedLead.id}`], ['Matched By', b.email]]) : '',
    section('Client Information', [['Name',`${clean(b.firstName)} ${clean(b.lastName)}`],['Email',b.email],['Phone',b.phone],['Project Address',b.address],['City',b.city],['State',b.state],['ZIP Code',b.zip],['Preferred Communication',b.preferredCommunication],['How They Heard About Lake Hazel',b.leadSource]]),
    section('About the Project', [['Project Type',b.projectType],['Spaces Included',b.spaces],['Approximate Square Footage',b.squareFootage],['Property Status',b.propertyStatus]]),
    section('What They Need Help With', [['Services Requested',b.services]]),
    section('What They Want to Change', [['What Is Not Working',b.currentProblems],['What They Want the Finished Space to Accomplish',b.desiredOutcome],['Three Biggest Priorities',b.priorities],['Existing Items to Keep',b.keepItems],['Absolutely Do Not Want',b.avoidItems]]),
    section('Style + Inspiration', [['Design Style',b.styles],['Desired Feeling',b.feelings],['Colors They Are Drawn To',b.colorsLike],['Colors They Dislike',b.colorsDislike],['Has Inspiration Images',b.hasInspirationImages],['Pinterest / Inspiration Board',b.inspirationUrl],['Uploaded Images / Files',files.length?`${files.length} file(s) attached to this task`:'']]),
    section('Budget', [['Project Investment — Excluding Design Fees',b.budget],['Budget Needs to Cover',b.budgetCoverage],['Separate Professional Design Budget',b.designBudget]]),
    section('Timeline', [['Ideal Start',b.idealStart],['Required Completion Date',b.completionDate],['Event Driving Timeline',b.timelineDriver]]),
    section('Construction', [['Contractor Status',b.contractorStatus],['Contractor / Company',b.contractorName],['Construction Started',b.constructionStarted],['Architectural / Construction Drawings',b.drawingsExist],['Permits Required',b.permits]]),
    section('Decision Making', [['Decision Makers',b.decisionMakers],['Final Approver',b.finalApprover],['Decision-Making Style',b.decisionStyle]]),
    section('Working Together', [['What They Want From a Designer',b.designerGoals],['Desired Level of Involvement',b.involvement],['Worked With an Interior Designer Before',b.workedWithDesigner],['Past Designer Experience',b.pastDesignerExperience]]),
    section('Final Questions', [['Definition of Success',b.successDefinition],['Additional Home / Family / Lifestyle / Project Notes',b.additionalNotes],['Readiness to Move Forward',b.readiness]])
  ].filter(Boolean).join('\n\n---\n\n');

  // For maximum reliability, every answer is written to the task description.
  // If you add matching ClickUp Custom Fields later, their IDs can be mapped here as custom_fields.
  const clickupResponse=await clickup(`/list/${CLICKUP_LIST_ID}/task`,{method:'POST',body:JSON.stringify({name:taskName,markdown_description:description,status:'intake'})});
  const data=await clickupResponse.json();if(!clickupResponse.ok){console.error('ClickUp error:',data);return res.status(clickupResponse.status).json({error:'ClickUp rejected the submission',detail:data});}

  let leadLinked = false;
  if (connectedLead) {
    try {
      const linkResponse = await clickup(`/task/${connectedLead.id}/link/${data.id}`, {
        method: 'POST',
      });
      if (!linkResponse.ok) throw new Error(`ClickUp task link failed: ${linkResponse.status}`);

      await Promise.all([
        clickup(`/task/${connectedLead.id}/comment`, {
          method: 'POST',
          body: JSON.stringify({
            comment_text: `Client questionnaire received: ${data.url || `https://app.clickup.com/t/${data.id}`}`,
            notify_all: false,
          }),
        }),
        clickup(`/task/${data.id}/comment`, {
          method: 'POST',
          body: JSON.stringify({
            comment_text: `Connected lead inquiry: ${connectedLead.url || `https://app.clickup.com/t/${connectedLead.id}`}`,
            notify_all: false,
          }),
        }),
      ]);
      leadLinked = true;
    } catch (error) {
      // The questionnaire is already saved; log linking errors without losing it.
      console.error('Lead linking error:', error);
    }
  }

  const attachmentErrors=[];for(const file of files){if(!file?.data||!file?.name)continue;try{const bytes=Buffer.from(file.data,'base64');const form=new FormData();form.append('attachment',new Blob([bytes],{type:file.type||'application/octet-stream'}),file.name);const r=await fetch(`https://api.clickup.com/api/v2/task/${data.id}/attachment`,{method:'POST',headers:{Authorization:process.env.CLICKUP_API_TOKEN},body:form});if(!r.ok)attachmentErrors.push(file.name);}catch(err){console.error('Attachment error:',file.name,err);attachmentErrors.push(file.name);}}
  return res.status(200).json({ok:true,taskId:data.id,taskUrl:data.url,attachmentErrors,leadMatched:Boolean(connectedLead),leadLinked});
}
