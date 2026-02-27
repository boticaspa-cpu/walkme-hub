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
    queryKey: ["commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*, sales(sold_at, total_mxn)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalCommission = commissions.reduce((a: number, c: any) => a + Number(c.amount_mxn), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Mis Comisiones</h1>
          <p className="text-sm text-muted-foreground">Comisiones generadas por tus ventas</p>
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
                  <TableHead className="hidden sm:table-cell">Venta Total</TableHead>
                  <TableHead className="hidden md:table-cell">Tasa</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin comisiones registradas</TableCell></TableRow>
                ) : commissions.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{c.sales?.sold_at ? new Date(c.sales.sold_at).toLocaleDateString("es-MX") : "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{c.sales ? fmt(Number(c.sales.total_mxn)) : "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{(Number(c.rate) * 100).toFixed(0)}%</Badge>
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
