// suggestions-worker.js — Cloudflare Worker relay for the homepage's
// search-suggestions dropdown.
//
// Deploy: Cloudflare dashboard → Workers → your worker → paste → Deploy.
// Page setting (Settings → Search suggestions → relay URL):
//   https://<your-worker>.workers.dev/?q=%s
//
// DuckDuckGo soft-blocks many datacenter egress IPs (HTTP 200 with an empty
// [] body) — Cloudflare Workers often land on such IPs. This worker:
//   1. sends real browser headers, which clears the block from some IPs;
//   2. falls back to Brave, then Bing, when DDG returns nothing — a query
//      only reaches a fallback if the provider before it failed;
//   3. caches results at the edge for 5 minutes to stay under rate limits.
// Remove an entry from PROVIDERS to opt out of that provider.
//
// Diagnostics: open  https://<your-worker>.workers.dev/?q=helium&debug
// in a browser to see every provider's status and result count as seen
// from the worker's own egress IP.

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  "Accept": "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

// ["query",["a","b",…]] — the OpenSearch shape all three providers serve.
const openSearch = (d) => (Array.isArray(d) && Array.isArray(d[1])) ? d[1] : [];

const PROVIDERS = [
  {
    name: "duckduckgo",
    url: (q) => "https://duckduckgo.com/ac/?q=" + encodeURIComponent(q) + "&type=list",
    referer: "https://duckduckgo.com/",
    parse: (d) => {
      const os = openSearch(d);
      if (os.length) return os;
      // the API sometimes serves its other shape: [{phrase:"…"},…]
      return Array.isArray(d) ? d.map((x) => x && x.phrase).filter(Boolean) : [];
    },
  },
  {
    name: "brave",
    url: (q) => "https://search.brave.com/api/suggest?q=" + encodeURIComponent(q),
    referer: "https://search.brave.com/",
    parse: openSearch,
  },
  {
    name: "bing",
    url: (q) => "https://api.bing.com/osjson.aspx?query=" + encodeURIComponent(q),
    referer: "https://www.bing.com/",
    parse: openSearch,
  },
];

function json(body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...(extraHeaders || {}),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const u = new URL(request.url);
    let q = (u.searchParams.get("q") || "").trim();
    // Tolerate the query arriving as a path ("/hello") — happens when the
    // page's relay URL was saved without the ?q=%s placeholder.
    if (!q) { try { q = decodeURIComponent(u.pathname.slice(1)).trim(); } catch (e) { q = ""; } }
    q = q.slice(0, 200);
    const debug = u.searchParams.has("debug");
    if (!q) return json(["", []]);

    // Serve repeats from the edge cache (per-colo) to ease provider load.
    const cache = typeof caches !== "undefined" ? caches.default : null;
    const cacheKey = new Request("https://suggest.cache/?q=" + encodeURIComponent(q.toLowerCase()));
    if (cache && !debug) {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    }

    const report = [];
    let result = null;
    for (const p of PROVIDERS) {
      try {
        const res = await fetch(p.url(q), {
          headers: { ...BROWSER_HEADERS, "Referer": p.referer },
          signal: AbortSignal.timeout(2500),
        });
        const list = res.ok ? p.parse(await res.json()).map(String).slice(0, 8) : [];
        report.push(p.name + ": http " + res.status + ", " + list.length + " results");
        if (list.length && !result) result = list;
      } catch (e) {
        report.push(p.name + ": " + (e && e.name === "TimeoutError" ? "timeout" : (e && e.message) || String(e)));
      }
      if (result && !debug) break; // debug mode probes every provider
    }

    if (debug) return json({ query: q, providers: report, served: result || [] });

    const res = json([q, result || []], result ? { "cache-control": "public, max-age=300" } : null);
    if (cache && result) {
      const put = cache.put(cacheKey, res.clone());
      if (ctx && ctx.waitUntil) ctx.waitUntil(put); else await put;
    }
    return res;
  },
};
