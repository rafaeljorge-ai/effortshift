# EffortShift: interactive Codex sessions use the native panel.
# shortcut: interactive zsh only; Desktop and absolute binary paths are separate.
codex() {
    local argument needs_value=0
    for argument in "$@"; do
        if (( needs_value )); then
            needs_value=0
            continue
        fi
        case "$argument" in
            -h|--help|-V|--version|--remote|--remote=*|--remote-auth-token-env|--remote-auth-token-env=*)
                command codex "$@"
                return $?
                ;;
            -c|--config|--enable|--disable|-i|--image|-m|--model|--local-provider|-p|--profile|-s|--sandbox|-C|--cd|--add-dir|-a|--ask-for-approval)
                needs_value=1
                ;;
            --) break ;;
            -*) ;;
            resume|fork) break ;;
            agents|tcp-tunnel|exec|e|review|login|logout|mcp|plugin|app-server|remote-control|app|completion|update|doctor|sandbox|debug|execpolicy|apply|a|queue|archive|delete|migrate-rollouts|unarchive|cloud|cloud-tasks|responses-api-proxy|stdio-to-uds|exec-server|features|help)
                command codex "$@"
                return $?
                ;;
            *) break ;;
        esac
    done
    command codex-effortshift "$@"
}
