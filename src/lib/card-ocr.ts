"use client";

/**
 * Leitura da carta pela câmera (OCR no próprio aparelho, sem enviar a foto para lugar nenhum).
 * Lê o número (025/165) e a sigla da coleção no rodapé e o nome no topo.
 */
type TesseractWorker = Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>>;
let workerPromise: Promise<TesseractWorker> | null = null;

export function getOcrWorker() {
  workerPromise ??= import("tesseract.js").then(({ createWorker }) => createWorker("eng"));
  return workerPromise;
}

/** Recorta uma faixa da carta (proporções de 0 a 1), aumenta e deixa em preto e branco com contraste. */
function strip(src: HTMLCanvasElement, x: number, y: number, w: number, h: number, scale = 2.5) {
  const c = document.createElement("canvas");
  c.width = Math.round(src.width * w * scale);
  c.height = Math.round(src.height * h * scale);
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, src.width * x, src.height * y, src.width * w, src.height * h, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  const mean = sum / (d.length / 4);
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    // texto escuro em fundo claro: estica o contraste em volta da média
    const v = Math.max(0, Math.min(255, (g - mean) * 2.2 + 128));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const DIGITS: Record<string, string> = { O: "0", o: "0", D: "0", Q: "0", I: "1", l: "1", i: "1", "|": "1", Z: "2", S: "5", s: "5", B: "8", G: "6", T: "7" };
const toDigits = (s: string) => s.replace(/[OoDQIli|ZSsBGT]/g, (ch) => DIGITS[ch] ?? ch);

/** Acha "025/165" (ou "TG05/TG30") num texto com ruído de OCR. */
export function findNumber(text: string): { number: string; total: string } | null {
  const t = text.replace(/\s+/g, " ");
  const special = t.match(/\b(TG|GG|SV|RC)\s?(\d{1,3})\s?\/\s?(TG|GG|SV|RC)?\s?(\d{1,3})\b/i);
  if (special) return { number: `${special[1].toUpperCase()}${special[2]}`, total: special[4] };
  const m = t.match(/([0-9OoDQIli|ZSsBGT]{1,3})\s?[/\\|]\s?([0-9OoDQIli|ZSsBGT]{2,3})(?![0-9])/);
  if (!m) return null;
  const number = toDigits(m[1]);
  const total = toDigits(m[2]);
  if (!/^\d+$/.test(number) || !/^\d+$/.test(total) || Number(total) < 10) return null;
  return { number, total };
}

export type OcrResult = { number?: string; total?: string; setCode?: string; name?: string; raw: string };

export async function readCard(card: HTMLCanvasElement): Promise<OcrResult> {
  const worker = await getOcrWorker();
  // Rodapé (número e sigla): canto inferior esquerdo nas cartas atuais, inferior direito nas antigas.
  await worker.setParameters({ tessedit_char_whitelist: "0123456789/ABCDEFGHIJKLMNOPQRSTUVWXYZ-" } as never);
  const bottom = await worker.recognize(strip(card, 0, 0.88, 1, 0.12));
  let text = bottom.data.text;
  let num = findNumber(text);
  if (!num) {
    const lower = await worker.recognize(strip(card, 0, 0.8, 1, 0.2, 2));
    text += `\n${lower.data.text}`;
    num = findNumber(lower.data.text);
  }
  const code = text.match(/\b([A-Z]{3})\b/)?.[1];
  // Nome no topo, sem lista fixa de caracteres
  await worker.setParameters({ tessedit_char_whitelist: "" } as never);
  const top = await worker.recognize(strip(card, 0.12, 0.025, 0.62, 0.075, 2));
  const name = top.data.text
    .split("\n")
    .map((l) => l.replace(/[^A-Za-zÀ-ÿ0-9' .&-]/g, " ").replace(/\s{2,}/g, " ").trim())
    .filter((l) => l.length >= 3)
    .sort((a, b) => b.length - a.length)[0]
    ?.replace(/^(BASIC|BASICO|BÁSICO|STAGE ?\d|ESTAGIO ?\d|ESTÁGIO ?\d)\s*/i, "");
  return { number: num?.number, total: num?.total, setCode: code && !["HP", "PV"].includes(code) ? code : undefined, name: name || undefined, raw: `${top.data.text}\n${text}` };
}
