export function isHttpUrl(value) {
  const text = String(value || "").trim();
  if (!text) return true;
  return /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(text) && text.length <= 300;
}
