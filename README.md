# Cofi MCP Server

커피 추출 기록과 원두 관리를 AI에서 직접 할 수 있는 MCP 서버.

Claude Desktop, Cursor 등 MCP를 지원하는 AI 클라이언트에서 자연어로 원두를 추가하고 추출 기록을 저장할 수 있다.

---

## 사전 요구사항

- Node.js >= 22
- Cofi 계정 ([cofi-web-steel.vercel.app](https://cofi-web-steel.vercel.app))
- Cofi PAT (Personal Access Token) — 웹 `/settings/tokens`에서 발급

---

## 설치

```bash
npx @cofi/mcp
```

또는 글로벌 설치:

```bash
npm install -g @cofi/mcp
```

---

## MCP 클라이언트 설정

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 또는
`%APPDATA%\Claude\claude_desktop_config.json` (Windows)에 추가:

```json
{
  "mcpServers": {
    "cofi": {
      "command": "npx",
      "args": ["-y", "@cofi/mcp"],
      "env": {
        "COFI_PAT": "cofi_pat_여기에_토큰_입력"
      }
    }
  }
}
```

### Cursor

`.cursor/mcp.json`에 추가:

```json
{
  "mcpServers": {
    "cofi": {
      "command": "npx",
      "args": ["-y", "@cofi/mcp"],
      "env": {
        "COFI_PAT": "cofi_pat_여기에_토큰_입력"
      }
    }
  }
}
```

---

## 사용 가능한 툴

| 툴 | 설명 |
|----|------|
| `list_beans` | 내 원두 목록 조회 |
| `list_brew_logs` | 추출 기록 목록 조회 (페이지네이션) |
| `match_variety` | 품종 자연어 입력 → DB 매칭 (게이샤, Gesha, geisha 모두 인식) |
| `create_bean` | 원두 추가 |
| `create_brew_log` | 추출 기록 저장 |

### 사용 예시

```
"어제 산 에티오피아 게이샤 원두 추가해줘. 라이트 로스팅이고 구매일은 오늘이야."

"오늘 V60으로 추출한 거 기록해줘. 원두 15g, 물 250ml, 브루 시간 3분 30초."

"내 원두 목록 보여줘."
```

---

## 인증 방식

PAT(Personal Access Token)로 인증한다. OAuth 세션 없이 동작하므로 서버 환경에 적합하다.

- 토큰은 `COFI_PAT` 환경변수로 전달
- 토큰은 Cofi 웹 → `/settings/tokens`에서 발급/관리
- 토큰 원문은 서버에 저장되지 않음 (bcrypt 해시만 보관)

---

## 링크

- 웹: [cofi-web-steel.vercel.app](https://cofi-web-steel.vercel.app)
- CLI: [github.com/Keep-K/Cofi-cli](https://github.com/Keep-K/Cofi-cli)
- 이슈: [github.com/Keep-K/Cofi-mcp/issues](https://github.com/Keep-K/Cofi-mcp/issues)
