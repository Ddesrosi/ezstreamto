export async function getClientIp(): Promise<string | null> {
  try {
    const res = await fetch('https://ifconfig.me/ip');
    const ip = await res.text();
    console.log('🌍 IP received from ifconfig.me:', ip);
    return ip.trim();
  } catch (error) {
    console.error('❌ Failed to fetch public IP', error);
    return null;
  }
}
