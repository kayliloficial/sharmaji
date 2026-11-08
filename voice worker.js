/**
 * Sharmaji · relais de voix réaliste (Cloudflare Worker)
 * -------------------------------------------------------
 * La page envoie le texte de Raj ici. Le Worker appelle ElevenLabs avec VOTRE clé
 * (gardée secrète côté serveur) et renvoie un fichier audio MP3.
 *
 * À configurer dans Cloudflare › Workers › votre worker › Settings › Variables :
 *   ELEVENLABS_API_KEY  (Secret)  votre clé ElevenLabs — ne jamais la mettre dans la page
 *   VOICE_ID_FR         (Texte)   identifiant de la voix française (bibliothèque ElevenLabs)
 *   VOICE_ID_EN         (Texte)   identifiant de la voix anglaise (facultatif, sinon VOICE_ID_FR)
 *   MODEL_ID            (Texte)   facultatif, par défaut "eleven_flash_v2_5" (rapide et économique)
 *                                 ou "eleven_v4_turbo" (plus expressif, rapide)
 *   ALLOWED_ORIGIN      (Texte)   l'adresse de votre site, ex. https://votre-nom.github.io
 *                                 (plusieurs adresses séparées par des virgules)
 */

const DEFAULT_VOICE = "JBFqnCBsd6RMkjVDRZzb"; // voix de démonstration, à remplacer par une voix française
const MAX_CHARS = 600;                          // limite par message, évite les abus

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.length === 0 || allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? (origin || "*") : "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return new Response("Utilisez POST", { status: 405, headers: cors });
    if (!okOrigin) return new Response("Origine non autorisée", { status: 403, headers: cors });
    if (!env.ELEVENLABS_API_KEY) return new Response("Clé ElevenLabs manquante", { status: 500, headers: cors });

    let body;
    try { body = await request.json(); } catch { return new Response("JSON invalide", { status: 400, headers: cors }); }
    const text = String(body.text || "").trim().slice(0, MAX_CHARS);
    const lang = body.lang === "en" ? "en" : "fr";
    if (!text) return new Response("Texte vide", { status: 400, headers: cors });

    const voice = (lang === "en" ? env.VOICE_ID_EN : env.VOICE_ID_FR) || env.VOICE_ID_FR || DEFAULT_VOICE;
    const model = env.MODEL_ID || "eleven_flash_v2_5";

    // Cache : une phrase déjà prononcée n'est pas refacturée (accueil, questions fréquentes…)
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${voice}|${model}|${lang}|${text}`));
    const key = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
    const cacheKey = new Request(`https://voix.cache/${key}.mp3`);
    const cache = caches.default;
    const hit = await cache.match(cacheKey);
    if (hit) {
      const r = new Response(hit.body, hit);
      Object.entries(cors).forEach(([k, v]) => r.headers.set(k, v));
      r.headers.set("X-Cache", "HIT");
      return r;
    }

    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json", "Accept": "audio/mpeg" },
        body: JSON.stringify({
          text,
          model_id: model,
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
        }),
      }
    );

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 300);
      return new Response(`Erreur ElevenLabs ${upstream.status} : ${detail}`, { status: 502, headers: cors });
    }

    const audio = await upstream.arrayBuffer();
    const headers = { ...cors, "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=2592000", "X-Cache": "MISS" };
    ctx.waitUntil(cache.put(cacheKey, new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=2592000" } })));
    return new Response(audio, { headers });
  },
};