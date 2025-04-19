export function getOrCreateUUID(): string {
  const key = 'visitor_id';
  let uuid = localStorage.getItem(key);

  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem(key, uuid);
    console.log('🆕 New UUID generated and saved:', uuid);
  } else {
    console.log('✅ Existing UUID found:', uuid);
  }

  return uuid;
}

