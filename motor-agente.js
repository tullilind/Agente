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

  function carregarBibliotecaApple() {
    if (global.AtlasAppleReferenceLibrary) {
      return Promise.resolve(global.AtlasAppleReferenceLibrary);
    }
    return loadScript("apple-design-agent/reference-library/library.js");
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

  async function consultarBibliotecaApple(topico) {
    const library = await carregarBibliotecaApple();
    if (!library) throw new Error("Biblioteca Apple não ficou disponível.");
    return library.getTopic(topico);
  }

  async function criarDesignApple(descricao, opcoes) {
    const [engine, library] = await Promise.all([
      carregarDesignerApple(),
      carregarBibliotecaApple()
    ]);

    if (!engine) throw new Error("Designer Apple não ficou disponível.");

    const spec = engine.createDesignBrief(descricao, opcoes || {});
    const validation = engine.validateSpec(spec);

    let referenceContext = null;
    if (library) {
      const intent = spec.designIntent || "general-product";
      const topics = intent === "dashboard"
        ? ["dashboard", "navigation", "accessibility", "tokens"]
        : intent === "authentication"
          ? ["forms", "accessibility", "tokens"]
          : ["navigation", "accessibility", "tokens"];

      referenceContext = await library.buildContext(topics);
    }

    return { spec, validation, referenceContext };
  }

  global.MotorAgente = {
    carregarDesignerApple,
    carregarBibliotecaApple,
    consultarBibliotecaApple,
    criarDesignApple,
    get ready() {
      return Promise.all([carregarDesignerApple(), carregarBibliotecaApple()]);
    }
  };

  Promise.all([carregarDesignerApple(), carregarBibliotecaApple()]).catch((err) => {
    console.error("[ATLAS Apple Design Agent]", err);
  });
})(window);
