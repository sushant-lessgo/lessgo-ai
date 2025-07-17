1. User Selects a Button (Element Level Toolbar)
✅ Show Button Configuration Modal with three options:

[ ] Link to External URL

[] Integrate with Mailchimp or convertKit

[ ] Trigger Native Form Submission


2. IF "Link to External URL" is selected
Show input field: Enter URL

Store: buttonAction.type = "external"

Save: buttonAction.url = "<user_url>"

3. Integrate with Mailchimp or convertKit then integration workflow to be triggered

4. IF "Trigger Form Submission" is selected
Check:

IF no form exists → Prompt to create a new form

IF form exists → Allow linking to existing form

4. Create New Form (if needed)
Show modal: "Add Form"

Inputs:

Fields: [ ] Name [ ] Email [ ] Phone [ ] Message

Form Title, Button Text, Privacy Note

Placement:


 In Hero section
 In CTA Section



Save in usePageStore.forms[]

5. Link Button to Form
Store:

buttonAction.type = "form"

buttonAction.formId = <form_id>

buttonAction.behavior = "scrollTo" | "openModal"

6. Render Logic
IF buttonAction.type === "form"

Render scroll or modal trigger based on behavior

Render form at selected placement if not already rendered

7. Editing Existing Form
Access from Edit Header > Forms

Allow editing fields, text, layout

Allow deletion (with unlinking buttons)