export async function getClientIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to fetch public IP', error);
    return null;
  }
}
