<!-- markdownlint-disable-file -->
# HVE Builder evidence: hve-lifecycle, author, attempt 1

* Mode set: create
* Write boundary: .github/agents/hve-lifecycle.agent.md, .github/agents/subagents/zava-stakeholder-panel.agent.md, docs/facilitator.md (executive sponsor card only)
* Requirements: run DT Coach, BRD Builder, PRD Builder, Security Planner, RAI Planner, HVE Builder and RPI in sequence on one problem statement; simulated stakeholder subagents; caller-supplied model per stage; autonomous with gates; final assessment
* Model names: resolved from https://docs.github.com/en/copilot/reference/ai-models/supported-models on 2026-11-15 (Claude Haiku 4.5, Claude Haiku 5.5, Claude Sonnet 5, Claude Sonnet 5.5 listed GA). Models supplied by the caller ("recommended mix").
* Orchestrator omits model: (High responsibility, inherits session selection). Panel subagent pins Claude Haiku 4.5 (copilot) as a Low, caller-supplied profile.
* Host compatibility: agents/handoffs frontmatter not used; dispatch described in body.
* Persona source of truth: docs/facilitator.md character cards; panel body references them instead of copying.
* Host registration: not verified in VS Code; this session emulates dispatch through Copilot SDK task dispatch with per-dispatch models. Registration check deferred.
