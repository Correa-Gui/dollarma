import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuditLog = {
  id: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  action: string;
  user_id: string | null;
  user_name: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
};

// Fire-and-forget — nunca bloqueia a operação principal
export async function logAudit(
  entityType: string,
  entityId: string,
  entityName: string,
  action: string,
  changes?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let userName = user?.email ?? "desconhecido";

    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      if (profile?.display_name) userName = profile.display_name;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("audit_logs").insert({
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      action,
      user_id: user?.id ?? null,
      user_name: userName,
      changes: changes ?? null,
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}

export function useAuditLogs(filters?: {
  entityType?: string;
  action?: string;
  days?: number;
}) {
  return useQuery({
    queryKey: ["audit_logs", filters],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (filters?.entityType && filters.entityType !== "all") {
        query = query.eq("entity_type", filters.entityType);
      }
      if (filters?.action && filters.action !== "all") {
        query = query.eq("action", filters.action);
      }
      if (filters?.days) {
        const since = new Date();
        since.setDate(since.getDate() - filters.days);
        query = query.gte("created_at", since.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });
}
