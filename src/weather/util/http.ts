// HTTP client for weather APIs
export async function httpGET(url: string): Promise<any> {
  const res = await fetch(url, { 
    method: "GET",
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'RaiAI-Weather/1.0'
    }
  });
  
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 180)}`);
  }
  
  return res.json();
}
