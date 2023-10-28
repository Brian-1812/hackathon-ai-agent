export const extractUrls = (text: string) => {
  var matches = text.match(/\bhttps?:\/\/\S+/gi);
  return matches;
};

export const replaceUrls = (text: string, replacement: string) => {
  const urls = extractUrls(text);
  if (!urls) return { text, urls: [] };
  for (const url of urls) {
    text = text.replaceAll(url, replacement);
  }
  return { text, urls };
};
