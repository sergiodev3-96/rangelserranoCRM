CREATE TABLE public.whatsapp_messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sent_by             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_name       text NOT NULL,
  message_body        text NOT NULL,
  provider            text NOT NULL DEFAULT 'mock'
                      CHECK (provider IN ('mock', 'meta_cloud_api', 'twilio')),
  provider_message_id text,
  status              text NOT NULL DEFAULT 'simulated'
                      CHECK (status IN ('sent', 'failed', 'simulated')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER whatsapp_messages_set_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_whatsapp_messages_lead_id ON public.whatsapp_messages(lead_id);
CREATE INDEX idx_whatsapp_messages_sent_by ON public.whatsapp_messages(sent_by);

-- RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_messages_select_authenticated"
  ON public.whatsapp_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "whatsapp_messages_insert_own_or_admin"
  ON public.whatsapp_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sent_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "whatsapp_messages_delete_admin"
  ON public.whatsapp_messages FOR DELETE
  TO authenticated
  USING (public.is_admin());
