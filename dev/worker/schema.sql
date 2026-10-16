-- Join-team applications.
--
-- One row per applicant. `email` is UNIQUE so the database itself enforces
-- "one application per person" rather than trusting application code.

CREATE TABLE IF NOT EXISTS applications (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name      TEXT    NOT NULL,
  email          TEXT    NOT NULL UNIQUE,
  phone          TEXT    NOT NULL,
  committee      TEXT    NOT NULL,
  academic_track TEXT    NOT NULL DEFAULT '',
  why_join       TEXT    NOT NULL,
  portfolio_link TEXT    NOT NULL DEFAULT '',
  -- JSON array of { id, label, answer }. The label is stored so a record from
  -- last season still reads correctly after the questions are reworded.
  answers        TEXT    NOT NULL DEFAULT '[]',
  status         TEXT    NOT NULL DEFAULT 'New',
  submitted_at   TEXT    NOT NULL,
  user_agent     TEXT    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_committee ON applications(committee);
CREATE INDEX IF NOT EXISTS idx_applications_submitted ON applications(submitted_at DESC);
