# Topics and categories

Open Admin → Topics & Categories. New Topic supports an optional category;
New Category creates a group independently. Existing Nuggets retain their topics.

Import CSV accepts UTF-8 files up to 1 MB and 500 data rows. Download the template,
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
