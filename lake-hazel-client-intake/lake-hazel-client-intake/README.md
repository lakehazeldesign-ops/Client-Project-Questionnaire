# Lake Hazel Client Project Questionnaire → ClickUp

## ClickUp destination
- Space: LH Design
- List: Designer Client Onboarding
- List ID: `901418740109`
- New task status: `intake`
- Task naming: `First Last — Project Type — City`

## Questionnaire contents
The Squarespace questionnaire includes the full Lake Hazel intake: client/contact details, lead source, project type, spaces, square footage, property status, requested services, goals and pain points, priorities, keep/avoid notes, style, desired feeling, color preferences, Pinterest board, image/file uploads, construction/furnishings investment excluding design fees, budget coverage, separate design budget, timeline, contractor/construction status, drawings, permits, decision-makers, decision style, designer expectations, involvement preference, prior designer experience, definition of success, final notes, and readiness to proceed.

## File uploads
The form accepts up to 10 JPG, PNG, WebP, or PDF files. Images are compressed in the browser before submission. Files are attached to the resulting ClickUp task.

## Secure connection setup
1. Create a private ClickUp personal API token.
2. In Vercel, add an Environment Variable named `CLICKUP_API_TOKEN` containing that token. Never place the token in Squarespace HTML.
3. Deploy this folder to Vercel.
4. Copy the deployment domain.
5. In `client-questionnaire.html`, replace `https://YOUR-VERCEL-DOMAIN.vercel.app/api/client-intake` with the deployed endpoint.
6. Paste the full HTML into a Squarespace Code Block.

## ClickUp mapping
The backend keeps all questionnaire answers organized in the ClickUp task description, so no answers are lost even if custom fields do not yet exist. Reporting-friendly values are captured independently by the form and can be mapped to ClickUp Custom Fields once the field IDs exist: Email, Phone, Project Address, Project Type, Project Spaces, Scope, Project Budget, Desired Start, Target Completion, Contractor Status, Lead Source, Style, Decision Style, and Lead Status/Readiness.
