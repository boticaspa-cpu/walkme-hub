import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CashSession {
  id: string;
  register_id: string;
  opened_by: string;
  opened_at: string;
  business_date: string;
  opening_float_mxn: number;
  opening_fx: any;
  status: "open" | "closed";
  closed_by: string | null;
  closed_at: string | null;
  expected_cash_mxn: number | null;
  counted_cash_mxn: number | null;
  variance_mxn: number | null;
  notes: string | null;
}

export interface CashMovement {
  id: string;
  session_id: string;
  type: string;
  amount_mxn: number;
  amount_fx: number | null;
  currency_fx: string | null;
  reference: string | null;
  created_by: string;
  created_at: string;
}

export function useCashSession() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Get default register
  const { data: registers = [] } = useQuery({
    queryKey: ["cash-registers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cash_registers")
        .select("*")
        .eq("active", true)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  // Get current open session (any register)
  const { data: activeSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ["cash-session-open"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cash_sessions")
        .select("*")
        .eq("status", "open")
        .maybeSingle();
      if (error) throw error;
      return (data as CashSession) || null;
    },
  });

  // Get movements for active session
  const { data: movements = [] } = useQuery({
    queryKey: ["cash-movements", activeSession?.id],
    enabled: !!activeSession?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("cash_movements")
        .select("*")
        .eq("session_id", activeSession!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CashMovement[];
    },
  });

  // Get sales linked to active session
  const { data: sessionSales = [] } = useQuery({
    queryKey: ["cash-session-sales", activeSession?.id],
    enabled: !!activeSession?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sales")
        .select("*")
        .eq("cash_session_id", activeSession!.id);
      if (error) throw error;
      return data as any[];
    },
  });

  const openSession = useMutation({
    mutationFn: async (params: {
      registerId: string;
      floatMxn: number;
      fxJson?: any;
      notes?: string;
    }) => {
      const { error } = await (supabase as any).from("cash_sessions").insert({
        register_id: params.registerId,
        opened_by: user?.id,
        opening_float_mxn: params.floatMxn,
        opening_fx: params.fxJson || null,
        notes: params.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-session-open"] });
    },
  });

  const closeSession = useMutation({
    mutationFn: async (params: {
      sessionId: string;
      expectedCashMxn: number;
      countedCashMxn: number;
      varianceMxn: number;
      notes?: string;
    }) => {
      const { error } = await (supabase as any)
        .from("cash_sessions")
        .update({
          status: "closed",
          closed_by: user?.id,
          closed_at: new Date().toISOString(),
          expected_cash_mxn: params.expectedCashMxn,
          counted_cash_mxn: params.countedCashMxn,
          variance_mxn: params.varianceMxn,
          notes: params.notes || null,
        })
        .eq("id", params.sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-session-open"] });
      qc.invalidateQueries({ queryKey: ["cash-movements"] });
      qc.invalidateQueries({ queryKey: ["cash-session-sales"] });
    },
  });

  const addMovement = useMutation({
    mutationFn: async (params: {
      sessionId: string;
      type: string;
      amountMxn: number;
      reference?: string;
      amountFx?: number;
      currencyFx?: string;
    }) => {
      const { error } = await (supabase as any).from("cash_movements").insert({
        session_id: params.sessionId,
        type: params.type,
        amount_mxn: params.amountMxn,
        amount_fx: params.amountFx || null,
        currency_fx: params.currencyFx || null,
        reference: params.reference || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cash-movements"] });
    },
  });

  const isSessionOpen = !!activeSession && activeSession.status === "open";
  const defaultRegister = registers.length > 0 ? registers[0] : null;

  return {
    registers,
    defaultRegister,
    activeSession,
    isSessionOpen,
    isLoadingSession,
    movements,
    sessionSales,
    openSession,
    closeSession,
    addMovement,
  };
}
