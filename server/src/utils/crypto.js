import crypto from "crypto";
import 'dotenv/config'; 


const key = Buffer.from(process.env.LC_CRED_ENC_KEY_BASE64 || "", "base64");
if (key.length !== 32) {
  console.warn("[WARN] LC_CRED_ENC_KEY_BASE64 missing or not 32 bytes – encryption will fail");
}

export function encryptJson(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    data: Buffer.concat([enc, tag]).toString("base64"),
  };
}

export function decryptJson({ iv, data }) {
  const ivBuf = Buffer.from(iv, "base64");
  const buf = Buffer.from(data, "base64");
  const enc = buf.slice(0, buf.length - 16);
  const tag = buf.slice(buf.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuf);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString("utf8"));
}
