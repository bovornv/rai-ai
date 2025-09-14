export function decodeBase64Image(s: string): Buffer {
  const m = s.match(/^data:.*;base64,(.*)$/);
  const b64 = m ? m[1] : s;
  return Buffer.from(b64, "base64");
}
