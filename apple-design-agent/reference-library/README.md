# ATLAS Apple Reference Library — 2026

Biblioteca de referência para o agente de design do projeto `Agente`.

## Propósito

Esta pasta é a base consultável do ATLAS Apple Design Agent. Ela reúne conhecimento estruturado para gerar interfaces originais inspiradas nas Human Interface Guidelines atuais sem copiar telas, marcas ou ativos proprietários da Apple.

## Versão de referência

Atualizada em 2026-09-27.

Referência oficial principal:
- Apple Human Interface Guidelines
- Apple Design Resources
- Apple Liquid Glass technology overview
- Apple UI Design Dos and Don'ts

Estado oficial observado na data acima:
- iOS / iPadOS 27 Design Resources
- macOS 27 Design Resources
- watchOS 26 Design Resources
- visionOS 26 Design Resources

## Estrutura

```
reference-library/
├── manifest.json
├── library.js
├── tokens/
│   ├── semantic-tokens.json
│   └── semantic-tokens.css
├── patterns/
│   ├── navigation.json
│   ├── forms.json
│   ├── dashboards.json
│   ├── liquid-glass.json
│   └── states-accessibility.json
└── examples/
    └── dashboard-reference.html
```

## Regra importante

Os tokens desta biblioteca são tokens próprios do ATLAS, derivados de princípios públicos e orientações de design. Eles não são uma redistribuição dos kits oficiais da Apple.

A biblioteca separa:
- `officialSources`: documentação oficial Apple.
- `communityReferences`: implementações abertas úteis como referência de engenharia.

O agente deve priorizar sempre `officialSources`.
