import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(190, 82%, 40%)", "hsl(175, 60%, 45%)", "hsl(38, 92%, 50%)", "hsl(340, 65%, 50%)", "hsl(260, 60%, 55%)"];

export default function Reportes() {
  // Sales by seller
  const { data: salesBySeller = [] } = useQuery({
    queryKey: ["report-sales-seller"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sales").select("total_mxn, profiles:sold_by(full_name)");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((s: any) => {
        const name = s.profiles?.full_name ?? "Sin asignar";
        map[name] = (map[name] ?? 0) + Number(s.total_mxn);
      });
      return Object.entries(map).map(([name, ventas]) => ({ name, ventas }));
    },
  });

  // Tours by category
  const { data: toursByCategory = [] } = useQuery({
    queryKey: ["report-tours-category"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("id, categories:category_id(name)");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((t: any) => {
        const name = t.categories?.name ?? "Sin categoría";
        map[name] = (map[name] ?? 0) + 1;
      });
      return Object.entries(map).map(([name, value]) => ({ name, value }));
    },
  });

  // Leads funnel
  const { data: leadsFunnel = [] } = useQuery({
    queryKey: ["report-leads-funnel"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("status");
      if (error) throw error;
      const order = ["new", "contacted", "interested", "quoted", "won"];
      const labels: Record<string, string> = { new: "Nuevos", contacted: "Contactados", interested: "Interesados", quoted: "Cotizados", won: "Ganados" };
      const map: Record<string, number> = {};
      (data ?? []).forEach((l: any) => { if (order.includes(l.status)) map[l.status] = (map[l.status] ?? 0) + 1; });
      return order.map(s => ({ stage: labels[s] ?? s, count: map[s] ?? 0 }));
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display">Reportes</h1>
        <p className="text-sm text-muted-foreground">Métricas y análisis — Solo Admin</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Ventas por Vendedor (MXN)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesBySeller}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 89%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="ventas" fill="hsl(190, 82%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tours por Categoría</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={toursByCategory} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {toursByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Funnel de Leads</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={leadsFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 89%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="stage" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(175, 60%, 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
