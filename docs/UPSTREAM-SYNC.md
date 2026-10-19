# Sincronização com Effortless

UPSTREAM.json registra repositório, branch, commit incorporado, versão e licença. Em19/10/2026 o upstream não tinha tags nem releases; o HEAD main observado era df5602ef9b49c70f678a3ce9a12518176e09afea. O monitor acompanha commits de main.

O workflow Upstream watch roda semanalmente e por workflow_dispatch. Com permissão issues:write, compara o HEAD remoto à base e abre uma issue por SHA novo, incluindo comparação. Pagina as issues existentes para evitar duplicação e não muda código, instalação ou branch. Comandos locais sem mutação externa:

```sh
npm run check:upstream
git remote add upstream https://github.com/HeyCubit/effortless.git # somente se ainda não existir
git fetch upstream main
```

Para incorporar uma atualização, crie uma issue/branch/PR exclusivos a partir de main limpa. Revise o diff upstream, incorpore mudanças e resolva conflitos preservando namespaces, manifests e o atualizador desativado. Não reinstale o plugin original sobre o fork. Mudanças no motor exigem npm run build:codex.

Antes de atualizar UPSTREAM.json, execute os gates Node, Claude, sintaxe/distribuição e browser quando aplicável, mais revisão independente. A versão upstream e a versão EffortShift são independentes. Só marque uma base como incorporada depois de verificar código e testes; observar um commit remoto não equivale a integrá-lo.

Publicação: tags v<semver> identificam código EffortShift; releases alpha são prereleases e descrevem limites por provedor. Nunca publique tokens, configurações de usuário, logs, capturas com telemetria real ou credenciais. Arquivos privados ficam fora do Git e dos arquivos de distribuição.

Baseline CI deste repositório novo: zero runs/minutos anteriores. A lane PR desconhecida/backend é completa; docs têm governança/scan; push main usa lane rápida; suíte completa semanal. Meça duração e runs/dia no GitHub depois da primeira execução; não alegue economia sem comparação equivalente.
