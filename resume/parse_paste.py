#!/usr/bin/env python3
"""Parse resume/resume_paste.txt (HRT-friendly plain-text export from LaTeX)
into _data/resume.yml consumed by Jekyll and generate_body.py.

Usage:  python3 resume/parse_paste.py [input] [output]
  input   defaults to resume/resume_paste.txt
  output  defaults to _data/resume.yml
"""

import os
import re
import sys


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
DEFAULT_IN = os.path.join(SCRIPT_DIR, "resume_paste.txt")
DEFAULT_OUT = os.path.join(REPO_ROOT, "_data", "resume.yml")

SECTION_HEADERS = [
    "Employment",
    "Education",
    "Achievements / Hobbies",
    "Technical Skills",
]

DATE_RE = re.compile(r"(\d{4}\s*-\s*(?:Present|\d{4}))\s*$")
BULLET_RE = re.compile(r"^\s*[–•\-]\s+")
TECH_LINE_RE = re.compile(r"^Tech:\s*")


def is_section_header(line: str) -> bool:
    return line.strip() in SECTION_HEADERS


def split_sections(lines: list[str]) -> dict:
    sections: dict = {}
    current = "__header__"
    sections[current] = []
    for line in lines:
        stripped = line.strip()
        if is_section_header(stripped):
            current = stripped
            sections[current] = []
        else:
            sections[current].append(line)
    return sections


def parse_header(lines: list[str]) -> dict:
    clean = [l.strip() for l in lines if l.strip()]
    if not clean:
        return {}
    return {"name": clean[0], "contact_lines": clean[1:]}


def parse_employment(lines: list[str]) -> list[dict]:
    """Two-pass parser: first find role blocks by looking for Tech: lines
    as delimiters, then extract company/title from the line before Tech:."""
    jobs: list[dict] = []

    stripped_lines = []
    for raw_line in lines:
        s = raw_line.strip()
        if s:
            stripped_lines.append(s)

    role_start_indices: list[int] = []
    for i, line in enumerate(stripped_lines):
        if TECH_LINE_RE.match(line) and i > 0:
            role_start_indices.append(i - 1)

    if not role_start_indices:
        return jobs

    for idx, start in enumerate(role_start_indices):
        end = role_start_indices[idx + 1] if idx + 1 < len(role_start_indices) else len(stripped_lines)

        role_line = stripped_lines[start]
        tech_line = stripped_lines[start + 1] if start + 1 < len(stripped_lines) else ""

        parts = [p.strip() for p in role_line.split(",")]
        company = parts[0] if parts else ""
        title = parts[1] if len(parts) > 1 else ""
        location = ", ".join(parts[2:]) if len(parts) > 2 else ""

        tech_and_date = TECH_LINE_RE.sub("", tech_line)
        date_match = DATE_RE.search(tech_and_date)
        date_range = ""
        tech_str = tech_and_date.strip()
        if date_match:
            date_range = date_match.group(1).strip()
            tech_str = DATE_RE.sub("", tech_and_date).strip().rstrip(",")

        bullets: list[str] = []
        bullet_parts: list[str] = []

        def flush_bullet():
            if bullet_parts:
                text = re.sub(r"\s+", " ", " ".join(bullet_parts)).strip()
                if text:
                    bullets.append(text)
                bullet_parts.clear()

        for line in stripped_lines[start + 2:end]:
            if BULLET_RE.match(line):
                flush_bullet()
                bullet_parts.append(BULLET_RE.sub("", line))
            else:
                bullet_parts.append(line)

        flush_bullet()

        jobs.append({
            "company": company,
            "title": title,
            "location": location,
            "tech": tech_str,
            "range": date_range,
            "bullets": bullets,
        })

    return jobs


def parse_education(lines: list[str]) -> list[dict]:
    entries: list[dict] = []
    current: dict | None = None
    bullet_parts: list[str] = []

    def flush_bullet():
        if current is not None and bullet_parts:
            text = " ".join(bullet_parts).strip()
            text = re.sub(r"\s+", " ", text)
            if text:
                current["highlights"].append(text)
            bullet_parts.clear()

    for raw_line in lines:
        stripped = raw_line.strip()
        if not stripped:
            continue

        if BULLET_RE.match(stripped):
            flush_bullet()
            bullet_parts.append(BULLET_RE.sub("", stripped))
        elif bullet_parts:
            bullet_parts.append(stripped)
        else:
            flush_bullet()
            date_match = DATE_RE.search(stripped)
            if date_match and current is None:
                school = DATE_RE.sub("", stripped).strip()
                current = {"school": school, "range": date_match.group(1).strip(), "degree": "", "highlights": []}
            elif current is not None and not current["degree"]:
                current["degree"] = stripped
            else:
                if current is not None:
                    entries.append(current)
                date_match2 = DATE_RE.search(stripped)
                if date_match2:
                    school = DATE_RE.sub("", stripped).strip()
                    current = {"school": school, "range": date_match2.group(1).strip(), "degree": "", "highlights": []}
                else:
                    current = {"school": stripped, "range": "", "degree": "", "highlights": []}

    flush_bullet()
    if current is not None:
        entries.append(current)
    return entries


def parse_achievements(lines: list[str]) -> list[str]:
    items: list[str] = []
    parts: list[str] = []

    def flush():
        if parts:
            items.append(re.sub(r"\s+", " ", " ".join(parts)).strip())
            parts.clear()

    for raw_line in lines:
        stripped = raw_line.strip()
        if not stripped:
            continue
        if BULLET_RE.match(stripped):
            flush()
            parts.append(BULLET_RE.sub("", stripped))
        else:
            parts.append(stripped)

    flush()
    return items


def parse_skills(lines: list[str]) -> list[str]:
    return [l.strip() for l in lines if l.strip()]


def yaml_escape(s: str) -> str:
    """Quote a string for YAML if it contains special characters."""
    if not s:
        return '""'
    needs_quote = any(c in s for c in ":#{}[]&*?|>!%@`,") or s.startswith("-") or s.startswith("'")
    if needs_quote or s != s.strip():
        escaped = s.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return s


def dump_yaml(resume: dict, f) -> None:
    """Emit resume dict as YAML without external dependencies."""
    meta = resume.get("meta", {})
    f.write("meta:\n")
    f.write(f"  name: {yaml_escape(meta.get('name', ''))}\n")
    f.write("  contact_lines:\n")
    for line in meta.get("contact_lines", []):
        f.write(f"    - {yaml_escape(line)}\n")

    f.write("\nexperience:\n")
    for job in resume.get("experience", []):
        f.write(f"  - company: {yaml_escape(job['company'])}\n")
        f.write(f"    title: {yaml_escape(job['title'])}\n")
        f.write(f"    location: {yaml_escape(job['location'])}\n")
        f.write(f"    tech: {yaml_escape(job['tech'])}\n")
        f.write(f"    range: {yaml_escape(job['range'])}\n")
        f.write("    bullets:\n")
        for b in job.get("bullets", []):
            f.write(f"      - {yaml_escape(b)}\n")

    f.write("\neducation:\n")
    for edu in resume.get("education", []):
        f.write(f"  - school: {yaml_escape(edu['school'])}\n")
        f.write(f"    range: {yaml_escape(edu['range'])}\n")
        f.write(f"    degree: {yaml_escape(edu['degree'])}\n")
        f.write("    highlights:\n")
        for h in edu.get("highlights", []):
            f.write(f"      - {yaml_escape(h)}\n")

    f.write("\nachievements:\n")
    for a in resume.get("achievements", []):
        f.write(f"  - {yaml_escape(a)}\n")

    f.write("\nskills:\n")
    for s in resume.get("skills", []):
        f.write(f"  - {yaml_escape(s)}\n")


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_IN
    output_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_OUT

    if not os.path.exists(input_path):
        sys.exit(f"parse_paste: {input_path} not found")

    with open(input_path, encoding="utf-8") as f:
        all_lines = f.readlines()

    sections = split_sections(all_lines)

    resume = {
        "meta": parse_header(sections.get("__header__", [])),
        "experience": parse_employment(sections.get("Employment", [])),
        "education": parse_education(sections.get("Education", [])),
        "achievements": parse_achievements(sections.get("Achievements / Hobbies", [])),
        "skills": parse_skills(sections.get("Technical Skills", [])),
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        dump_yaml(resume, f)

    print(f"parse_paste: wrote {output_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
