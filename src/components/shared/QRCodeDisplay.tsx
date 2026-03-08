import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  url: string;
  size?: number;
}

export default function QRCodeDisplay({ url, size = 200 }: Props) {
  const svgRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.download = "qr-code.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div ref={svgRef} className="bg-white p-4 rounded-lg border">
        <QRCodeSVG value={url} size={size} />
      </div>
      <p className="text-xs text-muted-foreground text-center">El cliente puede escanear este código para ver su documento</p>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
        <Download className="h-3.5 w-3.5" /> Descargar QR
      </Button>
    </div>
  );
}
