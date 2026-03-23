import { useRef } from "react";
import { FileText, Table2, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MappingCardsProps {
  onDocUpload: (file: File) => Promise<void>;
  onSheetImport: () => void;
  isMapping?: boolean;
  /** Accept string for the PDF/doc input. Defaults to "image/*,.pdf" */
  docAccept?: string;
}

export default function MappingCards({
  onDocUpload,
  onSheetImport,
  isMapping,
  docAccept = "image/*,.pdf",
}: MappingCardsProps) {
  const docInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (file) await onDocUpload(file);
  };

  const cards = [
    {
      label: "PDF / Doc",
      icon: FileText,
      color: "text-blue-500",
      onClick: () => docInputRef.current?.click(),
    },
    {
      label: "Sheets",
      icon: Table2,
      color: "text-emerald-500",
      onClick: onSheetImport,
    },
    {
      label: "Foto",
      icon: Camera,
      color: "text-purple-500",
      onClick: () => photoInputRef.current?.click(),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            disabled={isMapping}
            onClick={card.onClick}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl border border-border py-3 px-2 transition-colors cursor-pointer",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
              isMapping && "opacity-50 cursor-not-allowed"
            )}
          >
            {isMapping ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <card.icon className={cn("h-5 w-5", card.color)} />
            )}
            <span className="text-[11px] font-medium text-foreground">{card.label}</span>
          </button>
        ))}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={docInputRef}
        type="file"
        accept={docAccept}
        className="hidden"
        onChange={async (e) => {
          await handleFile(e.target.files?.[0]);
          if (e.target) e.target.value = "";
        }}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          await handleFile(e.target.files?.[0]);
          if (e.target) e.target.value = "";
        }}
      />
    </div>
  );
}
