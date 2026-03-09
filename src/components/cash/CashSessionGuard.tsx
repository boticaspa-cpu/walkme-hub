import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCashSession } from "@/hooks/useCashSession";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export function CashSessionGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeSession, isSessionOpen, isLoadingSession, defaultRegister, openSession } = useCashSession();
  const [floatAmount, setFloatAmount] = useState("0");
  const [isOpening, setIsOpening] = useState(false);

  if (isLoadingSession) return null;

  const today = startOfDay(new Date());

  // Case A: Session open from a previous day
  if (isSessionOpen && activeSession) {
    const sessionDate = startOfDay(new Date(activeSession.business_date + "T00:00:00"));
    if (isBefore(sessionDate, today)) {
      const formattedDate = format(sessionDate, "d 'de' MMMM", { locale: es });
      return (
        <Dialog open>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-center">Cierre de caja pendiente</DialogTitle>
              <DialogDescription className="text-center">
                Tienes una caja abierta del <strong>{formattedDate}</strong> que no fue cerrada. Debes realizar el cierre antes de continuar.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button className="w-full" onClick={() => navigate("/cierre-diario")}>
                Ir a Cierre de Caja
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }
    // Case C: Session open today — no modal
    return null;
  }

  // Case B: No active session — user can navigate freely.
  // POS has its own internal gate that checks for open cash session.
  return null;
}
