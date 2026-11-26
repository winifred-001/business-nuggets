# Business Nuggets — FAQ table support

Adds a safe, minimal Markdown table feature to FAQs. No backend changes, dependencies, or migrations required.

## Install (Windows Command Prompt)

1. Commit or back up pending work in the project first. Check `git status --short`.
2. Extract this ZIP into `C:\dev\business-nuggets`, preserving folders.
3. From the repository root run:

   `node scripts\install-faq-tables.cjs`

4. Verify:

   `git diff --check`

   `npx tsc --noEmit`

   `npm run build`

5. Deploy the frontend using the project's normal deployment process.

## Use

Admin > Site Pages > FAQs. Edit a question and click **+ Insert table** under **Content**. Replace the placeholder headings and cell values. Click **Show block preview**, then **Save changes**. Open `/faqs` to confirm it renders.

Example:

| Feature | Free | Premium |
| --- | --- | --- |
| Saved Nuggets | Limited | More access |
| Personal Notes | Yes | Yes |

- Separate cells with `|`. Leave the separator row (`| --- | --- |`) in place.
- To include an actual `|` inside a cell, write `\|`.
- Rows must have the same number of cells as the header.
- FAQ body text before and after tables is retained.
- Tables render as escaped text nodes through React, not raw HTML.
- Current plain-text FAQ answers remain unchanged.

## Files

- `components/FaqAnswer.tsx`: safe table and paragraph rendering.
- `scripts/install-faq-tables.cjs`: installer for the existing FAQ page, shared block preview, and admin editor.

## Notes

This intentionally does **not** enable arbitrary HTML in the FAQ editor. No actual FAQ copy is changed by the installer. Administrator input is stored in the existing page content field.
