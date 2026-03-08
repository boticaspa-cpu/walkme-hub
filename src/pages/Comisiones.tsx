import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const fmt = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default function Comisiones() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["commissions", isAdmin],
    queryFn: async () => {
      const query = supabase
        .from("commissions")
        .select("*, sales(sold_at, total_mxn), profiles!commissions_seller_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const totalCommission = commissions.reduce((a: number, c: any) => a + Number(c.amount_mxn), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">
            {isAdmin ? "Todas las Comisiones" : "Mis Comisiones"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Comisiones de todos los vendedores" : "Comisiones generadas por tus ventas"}
          </p>
        </div>
        <Card className="px-4 py-2">
          <p className="text-xs text-muted-foreground">Total este periodo</p>
          <p className="text-xl font-bold text-primary">{fmt(totalCommission)}</p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <p className="p-6 text-sm text-muted-foreground">Cargando…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  {isAdmin && <TableHead>Vendedor</TableHead>}
                  <TableHead className="hidden sm:table-cell">Venta Total</TableHead>
                  <TableHead className="hidden md:table-cell">Tasa</TableHead>
                  <TableHead className="hidden md:table-cell">Fee Tarjeta</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-8">Sin comisiones registradas</TableCell></TableRow>
                ) : commissions.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.sales?.sold_at ? new Date(c.sales.sold_at).toLocaleDateString("es-MX") : "—"}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-sm font-medium">{c.profiles?.full_name ?? "—"}</TableCell>
                    )}
                    <TableCell className="hidden sm:table-cell text-sm">{c.sales ? fmt(Number(c.sales.total_mxn)) : "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{(Number(c.rate) * 100).toFixed(0)}%</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {Number(c.card_fee_mxn) > 0 ? fmt(Number(c.card_fee_mxn)) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">{fmt(Number(c.amount_mxn))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
