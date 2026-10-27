# Topics and categories

Open Admin → Topics & Categories. New Topic supports an optional category;
New Category creates a group independently. Existing Nuggets retain their topics.

The shared Import dialog accepts UTF-8 CSV, Excel (.xlsx), and JSON files up to
5 MB and 500 data rows. Both the Nuggets and Topics & Categories Import buttons
open it with the appropriate content type selected. Download a template,
choose a file, preview it, then confirm the import. Required columns are `type,name`;
optional columns are `description,category,visible`.

```csv
type,name,description,category,visible
category,Leadership,Leadership wisdom,,true
topic,Integrity,"Honest, dependable work",Leadership,true
```

- A type is `topic` or `category`.
- Missing categories named by new topics are created automatically.
- Existing names preserve descriptions and visibility. A supplied category may link an uncategorized topic; conflicting category assignments stop the import.
- Duplicate rows, malformed CSV and conflicting URL slugs stop the import.
- Preview never saves data. Confirming validates again and writes in one transaction.
- Topics used by Nuggets cannot be deleted. Reassign those Nuggets first.
- Categories containing topics cannot be deleted. Move or uncategorize those topics first.
- Deleting an unused topic also removes its following entries, never Nuggets.

All management and import endpoints require the existing `manageNuggets` admin
permission and retain the normal authentication, IP policy and audit middleware.
Uploads use multipart field `file` on `POST /admin/topics/import/preview` and
`POST /admin/topics/import`. The normal backend startup migration command adds the
Category table and nullable Topic.categoryId association before the application starts.


Category summary files are recognized directly with columns
`Category,Brief Description,Number of Nuggets`. Category maps to name and Brief
Description maps to description. Number of Nuggets is reference data only and
is not written to the database or used to create Nuggets. The supplied 60-category
summary is a regression fixture. Database inserts explicitly select Category
fields, avoiding the former `Unknown column "row" in table "Category"` error.

Excel must contain one populated worksheet with headers in row 1. Formulas/error
cells must be replaced by values. JSON must contain an array of row objects using
the same headers; booleans can be actual JSON booleans. Templates are provided as
CSV and JSON. Open a CSV template in Excel and save as .xlsx to use Excel.

## Nuggets

Required columns: `number,title,topic`. Optional columns:
`slug,tag,scriptureRef,scriptureText,image,keyPrinciple,marketplaceApplication,
practicalActionPlan,duration,isGold,book,bibleSection,challenges,featured,songUrl,
nuggetUrl,status`. Column names also accept spaces/underscores and case variations.
The API field names `audioUrl,nuggetAudioUrl` are accepted for the two audio URLs.

- A missing slug is generated from title. Numbers must be positive unique integers.
- All imported Nuggets are drafts, including rows marked published. Review/publish
  using the existing editor so membership/free-publication policies still apply.
- A matching number, ID, or slug skips the existing Nugget without overwriting it.
- Lists accept JSON arrays of strings or text separated by `|` or line breaks.
- Song/Nugget audio URLs must be HTTPS. Images accept HTTPS or site-relative paths.
- Missing optional text fields are blank; duration defaults to 00:00.
- Preview saves nothing. Confirmation revalidates and writes atomically.
- POST `/admin/nuggets/import/preview` and `/admin/nuggets/import` use the same
  multipart field `file`, permissions, 5 MB limit, and format adapter as taxonomy.

Buttons provide hover, pressed, focus, and disabled/loading states. A synchronous
submit lock prevents duplicate requests while processing. On a partial list-load
failure, successful Topics/Categories responses remain visible with a retry action.
A categories 404 explains that the API deployment lacks the route rather than
misreporting the topics list as empty.


## Linked imports and bulk actions

Both entry points now use one transactional hierarchy planner. Nuggets imports
accept an optional `category` column alongside `number,title,topic`. Missing
categories and topics are created first, then Nuggets are assigned to the topic's
canonical stored name. An existing uncategorized topic can be linked to the supplied
category. An existing categorized topic cannot be silently moved; conflicting
categories reject the file before writes. Descriptions and visibility are preserved.
Skipped existing Nuggets do not create orphan categories or topics.

Topics & Categories can import all three levels in one flat CSV/Excel/JSON file.
Use `type=category` with `name,description`; `type=topic` with `name,category`;
and `type=nugget` with `number,title,topic,category` plus optional Nugget fields.
Templates include all three levels. Empty Nugget columns are allowed when the file
contains only category/topic rows. JSON uses an array of row objects, rather than
nested objects. Previews show new items, topic/category links and existing items
that will be skipped. All imported Nuggets remain drafts. Files allow 500 data
rows and 5 MiB (5 × 1024 × 1024 bytes).

To support the full upload size without sending a large body through the frontend
host, the browser requests POST `/admin/imports/ticket` using its HttpOnly-session
proxy, then uploads directly to POST `/admin-imports/:kind/:stage`. The short-lived
HMAC ticket is bound to the file size/hash, content kind, preview/commit operation,
user and existing session. It has a separate two-part format that cannot be used
as a normal JWT. The upload route revalidates the session, current admin account,
permissions and IP policy, and checks the actual uploaded bytes against the ticket.
No new environment secret is needed. Authorization and audit logging remain in place.
The original authenticated multipart endpoints remain available with the 5 MiB limit.

POST `/admin/nuggets/bulk`, `/admin/topics/bulk`, `/admin/categories/bulk` accept
`{ids: string[], action}` with 1–5000 distinct IDs. All actions are transactional.
Nuggets support delete, publish, draft, feature and unfeature; bulk publishing
respects the existing free-Nugget limit. Topics/categories support delete, show and
hide. Used topics/categories block the entire deletion, and unused topic deletion
also removes followed-topic entries. No bulk taxonomy deletion cascades to Nuggets.

Each list includes item checkboxes, filtered Select All across pages, a selected
count, Clear Selection, and available bulk actions. Filter changes clear selection.
Bulk deletion shows the exact selected names and requires confirmation in the UI.
