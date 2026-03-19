#!/usr/bin/env node
/**
 * Cofi MCP Server
 * PAT (Personal Access Token) 인증 필수
 * 환경변수: SUPABASE_URL, SUPABASE_ANON_KEY, COFI_PAT
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { BeanService } from "@cofi/core/services/bean.service";
import { BrewService } from "@cofi/core/services/brew.service";
import { MatchService } from "@cofi/core/services/match.service";

const SUPABASE_URL = process.env["SUPABASE_URL"] ?? "";
const SUPABASE_ANON_KEY = process.env["SUPABASE_ANON_KEY"] ?? "";
const PAT = process.env["COFI_PAT"] ?? "";

if (!PAT) {
  console.error("COFI_PAT 환경변수가 필요합니다.");
  process.exit(1);
}

// PAT 인증: 헤더로 Supabase Edge Function에 검증 요청
const authRes = await fetch(`${SUPABASE_URL}/functions/v1/pat-verify`, {
  headers: { Authorization: `Bearer ${PAT}` },
});
if (!authRes.ok) {
  console.error("PAT 인증 실패");
  process.exit(1);
}
const { userId } = (await authRes.json()) as { userId: string };

const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: `Bearer ${PAT}` } },
});

const beanService = new BeanService(db);
const brewService = new BrewService(db);
const matchService = new MatchService(db);

const server = new McpServer({
  name: "cofi",
  version: "0.1.0",
});

// ── 툴: 원두 목록 ─────────────────────────────────────────
server.registerTool(
  "list_beans",
  { description: "사용자의 원두 목록을 조회합니다." },
  async () => {
    const beans = await beanService.list(userId);
    return { content: [{ type: "text", text: JSON.stringify(beans, null, 2) }] };
  }
);

// ── 툴: 추출 기록 목록 ────────────────────────────────────
server.registerTool(
  "list_brew_logs",
  {
    description: "사용자의 추출 기록 목록을 조회합니다.",
    inputSchema: { page: z.number().int().min(1).optional().default(1) },
  },
  async ({ page }) => {
    const logs = await brewService.list(userId, page);
    return { content: [{ type: "text", text: JSON.stringify(logs, null, 2) }] };
  }
);

// ── 툴: 품종 매칭 ─────────────────────────────────────────
server.registerTool(
  "match_variety",
  {
    description: "자연어 품종 입력(예: 게이샤, gesha, Geisha)을 DB의 품종으로 매칭합니다.",
    inputSchema: { input: z.string().describe("품종 자연어 입력") },
  },
  async ({ input }) => {
    const results = await matchService.matchVariety(input);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

// ── 툴: 원두 추가 ─────────────────────────────────────────
server.registerTool(
  "create_bean",
  {
    description: "원두를 DB에 저장합니다. Required: name, purchaseDate",
    inputSchema: {
      name: z.string().describe("원두 이름 (Required)"),
      purchaseDate: z.string().describe("구매 날짜 YYYY-MM-DD (Required)"),
      roastPoint: z.string().optional().describe("로스팅 포인트: Light / Medium-Light / Medium / Medium-Dark / Dark"),
      roastDate: z.string().optional().describe("로스팅 날짜 YYYY-MM-DD (없으면 자동 추정)"),
      varietyId: z.string().optional().describe("품종 ID (match_variety 툴로 먼저 확인)"),
      originId: z.string().optional(),
      roasteryId: z.string().optional(),
      harvestSeason: z.string().optional(),
      rawVarietyInput: z.string().optional().describe("매칭 실패 시 원문 그대로 보관"),
      notes: z.string().optional(),
    },
  },
  async (input) => {
    const bean = await beanService.create(userId, input);
    return { content: [{ type: "text", text: JSON.stringify(bean, null, 2) }] };
  }
);

// ── 툴: 추출 기록 추가 ────────────────────────────────────
server.registerTool(
  "create_brew_log",
  {
    description: "추출 기록을 저장합니다. Required: beanId, methodId, beanWeightG, waterTotalMl",
    inputSchema: {
      beanId: z.string().describe("원두 ID (Required)"),
      methodId: z.string().describe("브루잉 도구 ID (Required)"),
      beanWeightG: z.number().describe("원두 무게 g (Required)"),
      waterTotalMl: z.number().describe("총 물 양 ml (Required)"),
      grinderId: z.string().optional(),
      grinderClick: z.number().optional(),
      waterProfileId: z.string().optional(),
      filterId: z.string().optional(),
      brewTempC: z.number().optional(),
      brewTimeSec: z.number().optional(),
      bypassWaterMl: z.number().optional(),
      usedIce: z.boolean().optional(),
      overallScore: z.number().min(1).max(10).optional(),
      tasteNotes: z.string().optional(),
      recipeName: z.string().optional(),
    },
  },
  async (input) => {
    const log = await brewService.create(userId, input);
    return { content: [{ type: "text", text: JSON.stringify(log, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
