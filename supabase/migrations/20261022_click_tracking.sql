-- Click tracking for the NeuroChiro routing funnel
-- Tracks: profile views via /r/[code] redirect, and CTA clicks (booking, phone, email, website)

-- 1. Add redirect_code column to reply_logs
ALTER TABLE reply_logs
  ADD COLUMN IF NOT EXISTS redirect_code text UNIQUE;

CREATE INDEX IF NOT EXISTS reply_logs_redirect_code_idx ON reply_logs (redirect_code);

-- 2. Create link_clicks table
CREATE TABLE IF NOT EXISTS link_clicks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_log_id uuid REFERENCES reply_logs(id) ON DELETE SET NULL,
  doctor_id   uuid REFERENCES doctors(id) ON DELETE SET NULL,
  destination text NOT NULL CHECK (destination IN ('profile', 'booking', 'website', 'phone', 'email')),
  user_agent  text,
  referrer    text,
  clicked_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS link_clicks_doctor_id_idx    ON link_clicks (doctor_id);
CREATE INDEX IF NOT EXISTS link_clicks_reply_log_id_idx ON link_clicks (reply_log_id);
CREATE INDEX IF NOT EXISTS link_clicks_clicked_at_idx   ON link_clicks (clicked_at);

-- RLS: service role only (admin client bypasses, no patient-facing reads needed yet)
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
