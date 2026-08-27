# 技术备忘：ch06-kv-cache.md（第 1 轮）

逐项对应移交编号：
- P0-1：原文有误，已改写
  - 证据：
    1. 本章基准 oh-my-pi `37eee71978`（2026-08-16）上 TTL 默认是 5m，不是 1h。`getCacheControl` 调 `resolveCacheRetention(cacheRetention, "short")`；仅 `retention === "long"` 且 `supportsLongCacheRetention` 时写 `ttl: "1h"`，否则省略，落到 Anthropic 5 分钟默认。英文注释原文：「Five-minute writes are the cheapest cache population strategy. Longer retention remains an explicit PI_CACHE_RETENTION/request override; idle sessions keep the short entry warm with bounded read-only refreshes.」（`oh-my-pi/packages/ai/src/providers/anthropic.ts:483-498`）。`resolveCacheRetention` 缺省回落 `"short"`（`oh-my-pi/packages/ai/src/utils.ts:484-492`）。coding-agent 默认打开刷新：`oh-my-pi/packages/coding-agent/src/sdk.ts:3275`；调度常量 5 分钟 TTL、提前 15 秒、最多 3 次（`oh-my-pi/packages/ai/src/stream.ts:1126-1128`），仅 `short` 才调度（`:1348`）。
    2. 中文注释「Agent 会话经常在后台任务上空闲超过 5 分钟，5m 断点在恢复时会整前缀冷失效」在 `37eee71978` 与 HEAD 均不存在（`git grep -F` 无命中）。对应英文曾出现在 2026-07-18 的 `b16d316aa9`（「agent sessions routinely idle past 5 minutes waiting on background jobs, and a 5m breakpoint cold-misses the entire prefix on resume」），当时 API-key 默认 1h；2026-08-13 的 `1132c3e31c` 改回 5m 加保温并删除该注释。`37eee71978` 是这两次提交的后代。
    3. `providers.cacheRetention` 默认 `"auto"` 是 2026-08-19 的 `565d53515b` 才写入 `settings-schema.ts`，晚于本章快照，不作为本章默认值依据。HEAD 上 `"auto"` 的 UI 描述仍是「Anthropic uses 5m entries kept warm by idle keep-alive refreshes」。
    4. pi-mono 基准 `d3ab2af969` 默认 5m 仍成立：`resolveCacheRetention` 无显式选项且 env 不是 `"long"` 时 `return "short"`（`pi-mono/packages/ai/src/api/anthropic-messages.ts:50-58`），`getCacheControl` 同样省略 `ttl`（`:60-73`）。
  - 处置：改写后关键句「oh-my-pi 和前身 pi-mono 默认都是 5 分钟档」。删掉不存在的中文注释与「两代产品反转默认值」故事；判断「必须按自己真实负载实测」留正文。定位符进 `[^6-32]`。
