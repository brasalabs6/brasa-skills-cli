---
title: "brasa-skills-cli MVP Production Readiness"
date: "2026-05-02"
slug: "mvp-production-readiness"
status: "relevant"
status_reason: "Report organizacional gerado para alinhar o repositorio brasa-skills-cli com o portifolio BrasaLabs."
last_reviewed_at: "2026-05-02"
source_path_legacy: "n/a"
---

# O Que Falta Para MVP E Producao

## Estado Atual Inferido

`brasa-skills-cli` parece ser um repo de **repositorio de suporte organizacional**. A analise foi estatica, baseada em contratos locais, metadados de pacote, scripts, inventario Git e reports de reconnaissance; portanto ela identifica gaps provaveis, mas nao substitui uma execucao completa de CI/deploy.

## Lacunas Prioritarias

- Criar script `validate` que encadeie os gates relevantes do repo.
- Criar checklist de readiness ou apontar para checklist central se o repo participa de MVP/producao.

## Gates Minimos Recomendados

- Documentacao: `README.md` + contrato local (`AGENTS.md` e spec quando aplicavel).
- Qualidade: lint/typecheck/test/build ou justificativa explicita quando algum gate nao fizer sentido.
- Operacao: env examples, runbook, smoke test e criterio claro de rollback para repos que rodam servico ou stack.
- Seguranca: garantir ausencia de secrets versionados, politica de tokens/credenciais e revisao de exposicao publica.
- Integracao: confirmar consumidores reais antes de alterar contratos, manifests ou nomes de pacote/imagem.

## Validacao Que Deve Existir Antes De Producao

Superficie detectada: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm start`.

Para declarar 100% pronto, executar os gates acima no runner esperado, registrar resultado no README/spec ou em report duravel, e fechar as lacunas listadas nesta pagina.

## Risco MVP

- Risco funcional: medio quando o repo publica pacote, imagem, app ou stack consumida por outros repos; baixo quando e template/governanca sem runtime.
- Risco operacional: aumenta se nao houver smoke test, release dry-run, env example ou runbook.
- Risco organizacional: aumenta quando o repo nao declara claramente se e fonte de verdade, clone de migracao, template ou consumidor.

## Evidencias

- `README.md:1`
- `AGENTS.md:1`
- `SPECs.md:1`
- `package.json:1`
