-- Modules Table
-- Stores module definitions that super admin can manage (add/edit/view)

-- Drop existing table if it has wrong schema
DROP TABLE IF EXISTS modules CASCADE;

CREATE TABLE modules (
  app_code TEXT PRIMARY KEY,          -- 'property', 'family', 'property_tax'
  label TEXT NOT NULL,                -- 'Property Survey'
  description TEXT,                   -- 'Record building details, ownership, GPS, and photos.'
  href TEXT DEFAULT '#',              -- 'survey.html'
  cta_text TEXT DEFAULT 'Open →',    -- 'Start Survey →'
  color TEXT DEFAULT 'blue',          -- 'blue', 'green', 'amber'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Super admins can manage modules
CREATE POLICY "Super admins can manage modules"
  ON modules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- All authenticated users can read modules (needed for dashboard rendering)
CREATE POLICY "Authenticated users can read modules"
  ON modules
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed existing modules
INSERT INTO modules (app_code, label, description, href, cta_text, color)
VALUES
  ('property',      'Property Survey',     'Record building details, ownership, GPS, and photos.', 'survey.html',   'Start Survey →',  'blue'),
  ('family',        'Household Register',  'Register households and family members.',             'household.html','Add Household →', 'green'),
  ('property_tax',  'Property Tax',        'Tax assessment and collection.',                       '#',            'Coming Soon',     'amber')
ON CONFLICT (app_code) DO NOTHING;
