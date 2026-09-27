(function (global) {
  "use strict";

  const BASE = "apple-design-agent/reference-library/";

  const TOPICS = {
    "navegacao": "patterns/navigation.json",
    "navigation": "patterns/navigation.json",
    "formulario": "patterns/forms.json",
    "forms": "patterns/forms.json",
    "dashboard": "patterns/dashboards.json",
    "painel": "patterns/dashboards.json",
    "glass": "patterns/liquid-glass.json",
    "liquid glass": "patterns/liquid-glass.json",
    "acessibilidade": "patterns/states-accessibility.json",
    "accessibility": "patterns/states-accessibility.json",
    "estados": "patterns/states-accessibility.json",
    "tokens": "tokens/semantic-tokens.json",
    "hig": "official/hig-catalog.json",
    "componentes": "official/hig-catalog.json",
    "components": "official/hig-catalog.json",
    "principios": "official/design-principles-2026.json",
    "principles": "official/design-principles-2026.json",
    "recursos": "official/design-resources-2026.json",
    "resources": "official/design-resources-2026.json",
    "exemplos": "official/real-apple-examples.json",
    "examples": "official/real-apple-examples.json",
    "premiados": "official/apple-design-awards-2026.json",
    "awards": "official/apple-design-awards-2026.json",
    "videos": "official/design-videos.json"
  };

  const SEARCH_FILES = [
    "official/hig-catalog.json",
    "official/design-principles-2026.json",
    "official/design-resources-2026.json",
    "official/real-apple-examples.json",
    "official/apple-design-awards-2026.json",
    "official/design-videos.json",
    "patterns/navigation.json",
    "patterns/forms.json",
    "patterns/dashboards.json",
    "patterns/liquid-glass.json",
    "patterns/states-accessibility.json",
    "tokens/semantic-tokens.json",
    "knowledge/apple-hig-rules.json",
    "knowledge/components.json"
  ];

  const cache = new Map();

  async function loadJSON(path) {
    if (cache.has(path)) return cache.get(path);

    const response = await fetch(BASE + path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Falha ao carregar referência Apple: " + path);
    }

    const data = await response.json();
    cache.set(path, data);
    return data;
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s/-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenize(value) {
    return normalize(value)
      .split(" ")
      .filter(token => token.length > 1);
  }

  function flatten(value, path, out) {
    if (value == null) return out;

    if (Array.isArray(value)) {
      value.forEach((item, index) => flatten(item, path + "[" + index + "]", out));
      return out;
    }

    if (typeof value === "object") {
      const scalar = {};
      let hasScalar = false;

      Object.entries(value).forEach(([key, item]) => {
        if (item == null || ["string","number","boolean"].includes(typeof item)) {
          scalar[key] = item;
          hasScalar = true;
        }
      });

      if (hasScalar) {
        out.push({ path, value: scalar });
      }

      Object.entries(value).forEach(([key, item]) => {
        if (item && typeof item === "object") {
          flatten(item, path ? path + "." + key : key, out);
        }
      });
      return out;
    }

    out.push({ path, value });
    return out;
  }

  function scoreRecord(record, tokens, platform) {
    const text = normalize(JSON.stringify(record));
    let score = 0;

    tokens.forEach(token => {
      const hits = text.split(token).length - 1;
      if (hits > 0) score += Math.min(hits, 5) * 3;
    });

    if (platform && text.includes(normalize(platform))) score += 5;
    if (text.includes("official-apple")) score += 2;
    if (text.includes("sourceurl") || text.includes("url")) score += 1;

    return score;
  }

  async function getManifest() {
    return loadJSON("manifest.json");
  }

  async function getTokens() {
    return loadJSON("tokens/semantic-tokens.json");
  }

  async function getTopic(topic) {
    const normalized = normalize(topic);
    let path = TOPICS[normalized];

    if (!path) {
      const key = Object.keys(TOPICS).find(item =>
        normalized.includes(item) || item.includes(normalized)
      );
      path = key ? TOPICS[key] : null;
    }

    if (!path) {
      const searchResult = await search(topic, { limit: 10 });
      return {
        found: searchResult.results.length > 0,
        topic,
        mode: "search-fallback",
        ...searchResult
      };
    }

    return {
      found: true,
      topic,
      mode: "topic",
      path,
      data: await loadJSON(path)
    };
  }

  async function search(query, options) {
    const opts = options || {};
    const tokens = tokenize(query);
    const platform = opts.platform || "";
    const limit = Math.max(1, Math.min(Number(opts.limit || 12), 30));

    if (!tokens.length) {
      return { query, platform, results: [], total: 0 };
    }

    const loaded = await Promise.all(
      SEARCH_FILES.map(async file => ({
        file,
        data: await loadJSON(file)
      }))
    );

    const candidates = [];

    loaded.forEach(({ file, data }) => {
      const rows = flatten(data, "", []);
      rows.forEach(row => {
        const score = scoreRecord(row.value, tokens, platform);
        if (score > 0) {
          candidates.push({
            score,
            sourceFile: file,
            path: row.path,
            data: row.value
          });
        }
      });
    });

    candidates.sort((a, b) => b.score - a.score);

    return {
      query,
      platform: platform || null,
      total: candidates.length,
      results: candidates.slice(0, limit)
    };
  }

  async function buildContext(topics, options) {
    const opts = options || {};
    const list = Array.isArray(topics) ? topics : [topics];
    const references = [];

    for (const topic of list.filter(Boolean)) {
      references.push(await getTopic(topic));
    }

    let searchResults = null;
    if (opts.query) {
      searchResults = await search(opts.query, {
        platform: opts.platform,
        limit: opts.limit || 12
      });
    }

    return {
      library: "ATLAS Apple Reference Library",
      version: "3.0.0",
      authorityOrder: ["official-apple", "atlas-derived", "community"],
      manifest: await getManifest(),
      references,
      searchResults
    };
  }

  async function getRealExamples(query, platform) {
    return search(query || "example design", {
      platform: platform || "",
      limit: 15
    });
  }

  global.AtlasAppleReferenceLibrary = Object.freeze({
    getManifest,
    getTokens,
    getTopic,
    search,
    buildContext,
    getRealExamples
  });
})(window);
