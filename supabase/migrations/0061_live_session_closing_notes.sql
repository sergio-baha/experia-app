-- ============================================================
-- 0061: Informe de cierre de la Clase en Vivo Guiada — comentarios
-- generales del profesor sobre la sesión, capturados al finalizarla.
--
-- No hace falta una RPC nueva: el host ya puede escribir directo su propia
-- fila de live_sessions (policy `ls_host_all` de 0022 — "for all using/with
-- check host_id = auth.uid()"), así que basta con agregar la columna. El
-- informe en sí (ranking final + estos comentarios) se arma en el navegador
-- con datos que ya existen (live_participants) — no hay tabla nueva.
--
-- ⚠️ Ejecutar MANUALMENTE en el SQL Editor de Supabase.
-- Idempotente.
-- ============================================================

alter table public.live_sessions add column if not exists closing_notes text;
