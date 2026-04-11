# Resume pipeline

Single source of truth: **`resume_paste.txt`** (plain-text copy-paste from your PDF).

## Workflow

1. Copy-paste your resume text into `resume_paste.txt`.
2. Run the parser:

   ```bash
   python3 resume/parse_paste.py
   ```

   This writes `_data/resume.yml`, which Jekyll uses to render the `/work` page.

3. Place your PDF at `resume.pdf` in the repo root (committed manually).
4. Run Jekyll as usual.

## CI

GitHub Actions runs step 2 automatically before `jekyll build` (see `.github/workflows/pages.yml`).

## Paste format

The parser expects section headers on their own line:

- `Employment`
- `Education`
- `Achievements / Hobbies`
- `Technical Skills`

Employment entries: role line (`Company, Title, Location`), then `Tech: ...` with a date range at end, then bullet lines starting with `–`, `•`, or `-`.

See `fixtures/` for a sample input and expected YAML output.
