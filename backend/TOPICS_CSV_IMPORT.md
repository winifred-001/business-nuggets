# Topics and categories

Open Admin → Topics & Categories. New Topic supports an optional category;
New Category creates a group independently. Existing Nuggets retain their topics.

The shared Import dialog accepts UTF-8 CSV, Excel (.xlsx), and JSON files up to
1 MB and 500 data rows. Both the Nuggets and Topics & Categories Import buttons
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
- Existing names are skipped, preserving descriptions, visibility and assignments.
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
  multipart field `file`, permissions, 1 MB limit, and format adapter as taxonomy.

Buttons provide hover, pressed, focus, and disabled/loading states. A synchronous
submit lock prevents duplicate requests while processing. On a partial list-load
failure, successful Topics/Categories responses remain visible with a retry action.
A categories 404 explains that the API deployment lacks the route rather than
misreporting the topics list as empty.
