import html2canvas from "html2canvas";

export async function generateImage(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png", 1.0);
  });
}

export async function downloadImage(element: HTMLElement, filename: string) {
  const blob = await generateImage(element);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.png`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareImage(element: HTMLElement, filename: string, title: string) {
  const blob = await generateImage(element);
  const file = new File([blob], `${filename}.png`, { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title,
      files: [file],
    });
  } else {
    await downloadImage(element, filename);
  }
}
