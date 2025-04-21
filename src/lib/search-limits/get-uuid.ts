export function getOrCreateUUID(): string {
  const key = 'visitor_id';

  // 🧠 1. Vérifie si un UUID est présent dans l’URL (ex: ?uuid=xxxx)
  const urlParams = new URLSearchParams(window.location.search);
  const uuidFromURL = urlParams.get('uuid');

 if (uuidFromURL && uuidFromURL !== localStorage.getItem(key)) {
  console.log('♻️ UUID from URL detected in getOrCreateUUID:', uuidFromURL);
  localStorage.setItem(key, uuidFromURL);

  // 🛑 Recharge la page uniquement si ce n’est pas déjà fait
  if (!sessionStorage.getItem('uuid_reload_done')) {
    sessionStorage.setItem('uuid_reload_done', 'true');
    window.location.href = window.location.href; // recharge avec ?uuid intact
  }

  // 💡 Stoppe l’exécution ici en attendant le reload
  return uuidFromURL;
}

  // 🧠 2. Sinon, on regarde dans localStorage
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
