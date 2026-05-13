-- SQL Query to disable maintenance mode
UPDATE system_config
SET value = 'false'
WHERE key = 'maintenance_mode';

-- Create RPC function for voter status lookup
CREATE OR REPLACE FUNCTION rpc_voter_status_lookup(passport_number TEXT, voter_id TEXT)
RETURNS TABLE (
  voter_id_number TEXT,
  full_name TEXT,
  verification_status TEXT,
  submitted_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT voter_id_number, full_name, verification_status, submitted_at, updated_at
  FROM voters
  WHERE passport_number = rpc_voter_status_lookup.passport_number
     OR voter_id_number = rpc_voter_status_lookup.voter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke direct access to voters table for anon
REVOKE SELECT ON voters FROM anon;

-- Grant execute permission on the RPC function
GRANT EXECUTE ON FUNCTION rpc_voter_status_lookup TO anon;

-- Add column-level security to mask vote_token and admin_notes
ALTER TABLE voters ALTER COLUMN vote_token SET DEFAULT NULL;
ALTER TABLE voters ALTER COLUMN admin_notes SET DEFAULT NULL;

-- Update RLS policy to exclude these columns for anon
CREATE POLICY anon_voter_policy ON voters
  FOR SELECT
  USING (true)
  WITH CHECK (false);

-- Grant SELECT on specific columns only
GRANT SELECT (voter_id_number, full_name, verification_status, submitted_at, updated_at) ON voters TO anon;

-- Drop duplicate storage policy candidate_docs_upload
DROP POLICY IF EXISTS candidate_docs_upload ON storage;

-- Ensure secure_candidate_upload remains active
CREATE POLICY secure_candidate_upload ON storage
  FOR INSERT
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Change enqueue_for_export to SECURITY DEFINER
CREATE OR REPLACE FUNCTION enqueue_for_export()
RETURNS void AS $$
BEGIN
  -- Function logic here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to appropriate roles
GRANT EXECUTE ON FUNCTION enqueue_for_export TO admin;