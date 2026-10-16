# Resume publishing workflow

`resume.tex` is the typeset source. The root-level `resume.pdf` is the downloadable version published at `/resume.pdf`. The `/work/` page is rendered from `_data/resume.yml`, generated from the normalized text in `resume_paste.txt`.

## Update the resume

1. Edit `resume.tex`.
2. Compile the PDF from this directory and copy it to the repository root:

   ```bash
   mkdir -p /tmp/resume-build
   pdflatex -interaction=nonstopmode -halt-on-error -output-directory=/tmp/resume-build resume.tex
   cp /tmp/resume-build/resume.pdf ../resume.pdf
   ```

3. Update `resume_paste.txt` to match the PDF text. Use pipe-separated role headers and a `Dates:` line so titles with commas and month-based dates parse correctly:

   ```text
   Reddit | Software Engineer III, Ads Privacy | Toronto, ON
   Dates: June 2025 - Present
   - Resume bullet
   ```

   Keep the section headings `Employment`, `Education`, `Achievements / Hobbies`, and `Technical Skills` on their own lines.

4. Regenerate the website data:

   ```bash
   python3 resume/parse_paste.py
   ```

   This updates `_data/resume.yml`; do not edit that generated file directly.

5. Preview the Jekyll site with Docker:

   ```bash
   docker compose run --rm site bundle exec jekyll build
   ```

   Check `/work/` and confirm `_site/resume.pdf` exists.

6. Commit `resume.tex`, `resume_paste.txt`, the generated `_data/resume.yml`, and the updated root `resume.pdf` together.

## Deployment

GitHub Actions runs the parser before building Jekyll. Jekyll copies the root-level PDF into `_site`, and the workflow verifies that it is present before deployment. The `/work/` page links directly to the published PDF.

The text parser also accepts the legacy `Tech:` metadata line for older resume paste files. New entries should use `Dates:` and the pipe-separated role header shown above.
