(function (global) {
  "use strict";

  const state = {
    loaded: false,
    loading: null
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-atlas-module="${src}"]`);
      if (existing) {
        if (global.AtlasAppleDesigner) return resolve(global.AtlasAppleDesigner);
        existing.addEventListener("load", () => resolve(global.AtlasAppleDesigner), { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.atlasModule = src;
      script.onload = () => {
        state.loaded = true;
        resolve(global.AtlasAppleDesigner);
      };
      script.onerror = () => reject(new Error("Falha ao carregar ATLAS Apple Design Agent."));
      document.head.appendChild(script);
    });
  }

  function carregarDesignerApple() {
    if (global.AtlasAppleDesigner) {
      state.loaded = true;
      return Promise.resolve(global.AtlasAppleDesigner);
    }

    if (!state.loading) {
      state.loading = loadScript("apple-design-agent/apple-designer.js");
    }

    return state.loading;
  }

  async function criarDesignApple(descricao, opcoes) {
    const engine = await carregarDesignerApple();
    if (!engine) throw new Error("Designer Apple não ficou disponível.");
    const spec = engine.createDesignBrief(descricao, opcoes || {});
    const validation = engine.validateSpec(spec);
    return { spec, validation };
  }

  global.MotorAgente = {
    carregarDesignerApple,
    criarDesignApple,
    get ready() {
      return carregarDesignerApple();
    }
  };

  carregarDesignerApple().catch((err) => {
    console.error("[ATLAS Apple Design Agent]", err);
  });
})(window);
