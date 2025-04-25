export function getOrCreateUUID(): string {
  const key = 'visitor_uuid';

  // 🧠 1. Vérifie si un UUID est présent dans l'URL (ex: ?uuid=xxxx)
  const urlParams = new URLSearchParams(window.location.search);
  const uuidFromURL = urlParams.get('uuid');

  if (uuidFromURL) {
    console.log('♻️ UUID from URL detected:', uuidFromURL);
    
    if (uuidFromURL !== localStorage.getItem(key)) {
      console.log('🔄 Updating stored UUID');
      localStorage.setItem(key, uuidFromURL);

      // 🛑 Recharge uniquement si nécessaire et pas déjà fait
      if (!sessionStorage.getItem('uuid_reload_done')) {
        sessionStorage.setItem('uuid_reload_done', 'true');
        
        // Remove uuid from URL but keep other params
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('uuid');
        window.history.replaceState({}, '', newUrl.toString());
        
        window.location.reload();
      }
    }

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