# Milestone 4 — AI Recommendation Engine & Polish
## Implementation Plan

**Tech Stack Decisions:**
- LLM: Google Gemini 2.5 Flash
- Rate Limiting: In-memory (`rate-limiter-flexible`)
- Sanitization: DOMPurify + jsdom
- Streaming: Non-streaming (standard request/response)
- Logging: Deferred to future iteration

---

## 📁 Project Structure (New Files)

```
src/
├── config/
│   └── env.ts                      # + Add Gemini env validation
├── middlewares/
│   ├── rateLimit.ts                # NEW — In-memory rate limiter
│   └── sanitizeInput.ts            # NEW — Clean user messages
├── repositories/
│   └── chat.repository.ts          # NEW — Chat data access layer
├── services/
│   └── ai-chat.service.ts          # NEW — Gemini orchestration
├── controllers/
│   └── chat.controller.ts          # NEW — Chat endpoints handler
├── routes/
│   └── chat.routes.ts              # NEW — Chat routes definition
├── schemas/
│   └── chat.schema.ts              # NEW — Zod validation for chat
├── utils/
│   ├── promptBuilder.ts            # NEW — Medical-safe prompt construction
│   └── sanitizer.ts                # NEW — DOMPurify wrapper
└── types/
    └── chat.ts                     # OPTIONAL — TypeScript types (if needed)
```

---

## 🎯 Task Breakdown

### **Phase 1: Foundation & Configuration**

#### Task 1.1 — Add Dependencies
**File:** `package.json`
- Install `@google/generative-ai`
- Install `dompurify`
- Install `jsdom` (required for DOMPurify in Node)
- Install `rate-limiter-flexible`

**Command:** `npm install @google/generative-ai dompurify jsdom rate-limiter-flexible`

---

#### Task 1.2 — Environment Variables Validation
**File:** `src/config/env.ts`
- Add `GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required")`
- Add `GEMINI_MODEL: z.string().default("gemini-2.5-flash")`
- Add `GEMINI_MAX_TOKENS: z.string().default("8192")` (adjust based on model limits)
- Add `GEMINI_TEMPERATURE: z.string().default("0.7")`
- Add `CHAT_RATE_LIMIT: z.string().default("50")` — requests per hour

**Note:** Gemini 2.5 Flash supports up to 1M context, but practical token limits for response should be capped.

---

#### Task 1.3 — Create Sanitizer Utility
**File:** `src/utils/sanitizer.ts`
- Import `DOMPurify` from `dompurify`
- Import `{ JSDOM }` from `jsdom` and create a global window
- Configure DOMPurify with appropriate settings:
  - Allow basic formatting tags if needed (e.g., `<b>`, `<i>`, `<br>`)
  - Strip all scripts, styles, event handlers
- Export `sanitizeInput(text: string): string` function
- Handle null/undefined gracefully

**Implementation:**
```ts
const window = new JSDOM('').window;
const purify = DOMPurify(window);
export const sanitizeInput = (text: string): string => {
  if (!text) return "";
  return purify.sanitize(text, { ALLOWED_TAGS: [] }); // strip all HTML
};
```

---

#### Task 1.4 — Create PromptBuilder Utility
**File:** `src/utils/promptBuilder.ts`
- Function `buildPrompt(userId: string, message: string, medicineList: string[], history: ChatMessage[]): string`
- **Structure:**
  1. System instruction: "You are a medical assistant helping users understand their medications..."
  2. Medical disclaimer: "IMPORTANT: I am an AI assistant, not a doctor..."
  3. Medicine list: "User's current medicines (max 50):\n- Medicine A\n- Medicine B..."
  4. Conversation history (last 10 messages or trim to fit token limit)
  5. Current user message
- Return single string prompt (Gemini accepts direct text or structured parts)

**Considerations:**
- Limit medicine list to 50 (as per spec)
- Format: `- {name} (expires: {date})` or just name
- Truncate history if total tokens exceed threshold (e.g., 80% of max tokens)
- Include follow-up prompt: "Please provide clear, helpful responses and ask if the user needs clarification."

---

### **Phase 2: Data Layer**

#### Task 2.1 — Create Chat Repository
**File:** `src/repositories/chat.repository.ts`
- Define `ChatSessionWithMessages` type (include messages relation)
- Implement:
  - `createSession(userId: string, status: ChatSessionStatus): Promise<ChatSession>`
  - `findSessionById(sessionId: string, userId: string): Promise<ChatSession | null>` — ensure ownership
  - `addMessage(sessionId: string, role: ChatMessageRole, content: string): Promise<ChatMessage>`
  - `findMessagesBySession(sessionId: string): Promise<ChatMessage[]>` — ordered by `createdAt ASC`
  - `findSessionWithMessages(sessionId: string, userId: string): Promise<ChatSessionWithMessages | null>` — preload messages

**Prisma:** Use existing models `ChatSession`, `ChatMessage`, enums `ChatSessionStatus`, `ChatMessageRole`.

**Selects:**
- For sessions: `{ id, userId, status, createdAt }`
- For messages: `{ id, sessionId, role, content, createdAt }`
- Include `messages: { orderBy: { createdAt: 'asc' } }` when fetching session with messages

---

### **Phase 3: Service Layer**

#### Task 3.1 — Create AI Chat Service
**File:** `src/services/ai-chat.service.ts`
- Import `GoogleGenerativeAI` from `@google/generative-ai`
- Import `GEMINI_API_KEY`, `GEMINI_MODEL`, etc. from `config/env`
- Import `chatRepo` from `repositories/chat.repository`
- Import `medicineRepo` from `repositories/medicine.repository`
- Import `promptBuilder` from `utils/promptBuilder`
- Import `sanitizeInput` from `utils/sanitizer`

**Class/Service:**
```ts
export const AIChatService = {
  async sendMessage(sessionId: string, userId: string, userMessage: string) {
    // 1. Sanitize input
    // 2. Load or create session (if sessionId is 'new', create)
    // 3. Save user message to chat repository
    // 4. Load chat history (last N messages, e.g., 10)
    // 5. Load user medicines (limit 50, active only or all?)
    // 6. Build prompt using promptBuilder
    // 7. Call Gemini API
    // 8. Save assistant response to chat repository
    // 9. Return { response: string, sessionId: string }
  }
}
```

**Gemini Integration:**
```ts
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: env.GEMINI_MODEL,
  generationConfig: {
    maxOutputTokens: parseInt(env.GEMINI_MAX_TOKENS),
    temperature: parseFloat(env.GEMINI_TEMPERATURE),
  }
});

// Convert history to Gemini format: { role: 'user'|'model', parts: [{text: ...}] }
// Note: ChatMessageRole.USER → 'user', ASSISTANT → 'model'
const history = ...;
const geminiHistory = history.map(msg => ({
  role: msg.role === 'USER' ? 'user' : 'model',
  parts: [{ text: msg.content }]
}));

// Add current message
geminiHistory.push({ role: 'user', parts: [{ text: userMessage }] });

const chat = model.startChat({ history: geminiHistory });
const result = await chat.sendMessage(promptBuilder.addContext()); // if using multi-part
const response = await result.response;
const responseText = response.text();
```

**Error Handling:**
- Catch Gemini API errors (rate limits, content blocked, etc.)
- Throw `APIError` with appropriate status (429, 500, etc.)
- Ensure partial messages (user message saved, but AI failed) — consider transaction or cleanup strategy

**Return value:** `{ sessionId, response: string }`

---

#### Task 3.2 — (Optional) AI Logging Service
**Deferred:** Logging without PII can be added later. No implementation now.

---

### **Phase 4: Controller Layer**

#### Task 4.1 — Create Chat Controller
**File:** `src/controllers/chat.controller.ts`
- `createSession(req: AuthenticatedRequest, res: Response)`:
  - Extract `userId` from `req.user`
  - Call `aiChatService.createSession(userId)` or `chatRepo.createSession()`
  - Return `201` with session `{ id, status, createdAt }`
  
- `sendMessage(req: AuthenticatedAndValidatedRequest, res: Response)`:
  - Extract `userId`, `sessionId` from params, `content` from body
  - Call `AIChatService.sendMessage(sessionId, userId, content)`
  - Return `200` with `{ sessionId, response }`

- `getMessages(req: AuthenticatedAndValidatedRequest, res: Response)`:
  - Extract `userId`, `sessionId` from params
  - Fetch session with messages (ensure ownership)
  - Return `200` with `{ sessionId, messages: [...] }` where each message has `{ id, role, content, createdAt }`

**Use:** `ResponseHelper.success()` for all responses.

---

### **Phase 5: Routing & Validation**

#### Task 5.1 — Create Chat Schemas
**File:** `src/schemas/chat.schema.ts`
- `CreateSessionSchema` — empty object (no body needed)
- `SendMessageSchema` — `{ content: z.string().min(1).max(4000) }` (max chars)
- `SessionIdParamSchema` — `{ id: z.uuid() }`
- Export types: `CreateSessionInput`, `SendMessageInput`, `SessionIdParam`

---

#### Task 5.2 — Create Chat Routes
**File:** `src/routes/chat.routes.ts`
```ts
const router = Router();

router.post(
  "/sessions",
  authenticate,
  validate(CreateSessionSchema),
  chatController.createSession
);

router.post(
  "/sessions/:id/messages",
  authenticate,
  validate(SessionIdParamSchema, "params"),
  validate(SendMessageSchema),
  chatController.sendMessage
);

router.get(
  "/sessions/:id/messages",
  authenticate,
  validate(SessionIdParamSchema, "params"),
  chatController.getMessages
);

export default router;
```

---

#### Task 5.3 — Register Chat Routes
**File:** `src/routes/index.ts`
- Add `import chat from "./chat.routes.js";`
- Add `router.use("/chat", chat);`
- **Resulting endpoints:**
  - `POST /api/v1/chat/sessions`
  - `POST /api/v1/chat/sessions/:id/messages`
  - `GET /api/v1/chat/sessions/:id/messages`

---

### **Phase 6: Security & Middleware**

#### Task 6.1 — Rate Limiting Middleware
**File:** `src/middlewares/rateLimit.ts`
- Use `rate-limiter-flexible`'s `RateLimiterMemory`
- Points: `env.CHAT_RATE_LIMIT` (default 50), duration: 3600 seconds (1 hour)
- Key: `userId` from `req.user`
- Middleware: `rateLimiter.consume(key)` — if rejected, throw `APIError(429, "Rate limit exceeded")`
- Apply **only to chat message endpoint** (not sessions creation)

**Implementation:**
```ts
const rateLimiter = new RateLimiterMemory({
  points: parseInt(env.CHAT_RATE_LIMIT),
  duration: 3600,
});

export const rateLimit = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as AuthenticatedRequest).user?.userId;
  if (!userId) throw new APIError("Unauthorized", 401);
  
  try {
    await rateLimiter.consume(userId);
    next();
  } catch {
    throw new APIError("Too many requests. Try again later.", 429);
  }
};
```

---

#### Task 6.2 — Sanitization Middleware
**File:** `src/middlewares/sanitizeInput.ts`
- Extract `content` from `req.body`
- Apply `sanitizeInput(content)`
- Replace `req.body.content` with sanitized version
- Call `next()`

**Apply to:** `POST /api/chat/sessions/:id/messages` only.

**Note:** This runs **before** controller, after validation (to ensure valid string format first).

---

#### Task 6.3 — Apply Security Middleware
**File:** `src/routes/chat.routes.ts` (update)
- For `sendMessage` route, add `rateLimit` and `sanitizeInput` **before** `validate`:
  ```ts
  router.post(
    "/sessions/:id/messages",
    authenticate,
    rateLimit,                    // ← New
    sanitizeInput,                // ← New (sanitizes req.body.content)
    validate(SessionIdParamSchema, "params"),
    validate(SendMessageSchema),
    chatController.sendMessage
  );
  ```

---

### **Phase 7: Integration & Edge Cases**

#### Task 7.1 — Handle Session Creation Strategy
**Decision Point:**
- Option A: Explicit session creation first (`POST /sessions` returns session ID, then use it for messages)
- Option B: Implicit session creation on first message (if `sessionId` not provided or `"new"`)

**Recommended: Option A** (explicit) — matches spec closely.

**Implementation:**
- `POST /sessions` creates `ACTIVE` session, returns `{ id, status, createdAt }`
- Client stores session ID and uses it for subsequent messages
- `sendMessage()` validates session exists and belongs to user

---

#### Task 7.2 — History Management
**In `ai-chat.service.ts`:**
- Fetch last 10 messages from repository (or less if new session)
- Pass to `promptBuilder` which may truncate based on token budget
- Gemini 2.5 Flash 1M context is large, but set reasonable limit (e.g., last 20 exchanges = 40 messages) to avoid cost explosion

**Token estimation:** Rough heuristic: 1 message ≈ 4 tokens per word, or use `tiktoken`-like lightweight approach if available. For MVP, hard limit to **last 20 messages**.

---

#### Task 7.3 — Medicine List Retrieval
**In `ai-chat.service.ts`:**
- Call `medicineRepo.findManyByUser(userId, { status: { not: REMOVED } })`
- Limit to 50 medicines (as per spec)
- Format: `- {name} (expires: {MM/DD/YYYY})` or just name
- If >50, truncate and note `...and X more` in prompt

---

#### Task 7.4 — Error Handling Strategy
**In `ai-chat.service.ts`:**
- Gemini API errors → catch and re-throw as `APIError` with:
  - 429: Rate limit from Gemini
  - 500: Internal AI service error
  - 400: Content blocked by safety filter (invalid request)
- Database errors → propagate as 500
- Session not found → 404
- User unauthorized (session ownership) → 403 or 404 (security: don't reveal existence)

**Graceful degradation:** If AI service down, return user-friendly message, not stack trace.

---

#### Task 7.5 — Response Format
**Standardize all chat responses:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "sessionId": "uuid",
    "response": "AI response text..."
  }
}
```

For `GET /messages`:
```json
{
  "success": true,
  "message": "Messages fetched",
  "data": {
    "sessionId": "uuid",
    "messages": [
      { "id": "...", "role": "USER", "content": "...", "createdAt": "..." },
      { "id": "...", "role": "ASSISTANT", "content": "...", "createdAt": "..." }
    ]
  }
}
```

---

### **Phase 8: Testing & Quality**

#### Task 8.1 — Manual API Testing Checklist
- [ ] `POST /api/v1/chat/sessions` → returns session with ACTIVE status
- [ ] `POST /api/v1/chat/sessions/:id/messages` with valid content → returns AI response
- [ ] Message saved in DB with correct `role=USER` and `role=ASSISTANT`
- [ ] `GET /api/v1/chat/sessions/:id/messages` returns all messages in chronological order
- [ ] Session ownership enforced (user A cannot access user B's session)
- [ ] Invalid session ID → 404
- [ ] Unauthenticated → 401
- [ ] Send message with HTML `<script>alert('xss')</script>` → sanitized before sending to Gemini
- [ ] Send 51 messages within 1 hour → 429 on 51st
- [ ] Empty message → validation error (400)
- [ ] Session creation doesn't count toward rate limit (only messages)
- [ ] History includes previous messages in prompt sent to Gemini (verify via logs)
- [ ] Medicine list appears in prompt (verify via logging once added)
- [ ] Disclaimer present in AI response (check response text)

#### Task 8.2 — Type Checking & Linting
- Run `npm run typecheck` (if script exists) or `npx tsc --noEmit`
- Fix any type errors
- Ensure consistent naming and coding style with existing codebase

#### Task 8.3 — Database Indexes Review
**Check if additional indexes needed for chat tables:**
- `ChatSession`: `@@index([userId, createdAt])` for listing sessions by user
- `ChatMessage`: `@@index([sessionId, createdAt])` for efficient message retrieval per session

**Update `prisma/schema.prisma` if indexes missing:**
```prisma
model ChatSession {
  // ... existing fields
  @@index([userId, createdAt])
}

model ChatMessage {
  // ... existing fields
  @@index([sessionId, createdAt])
}
```

---

## ⚠️ Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini API latency | User experience | Non-streaming may take 2-10s; set reasonable timeout (30s) |
| Gemini cost | Budget | Limit history + medicine list tokens; set max output tokens |
| Token limit exceeded | Prompt truncation | Implement truncation in `promptBuilder` before calling Gemini |
| History grows indefinitely | DB bloat | No TTL yet; plan future cleanup job |
| In-memory rate limiter memory usage | Multiple users | Use `Map<string, RateLimiter>` keyed by userId; `rate-limiter-flexible` handles this |
| XSS via AI response | Security | Sanitize **input only**; response may contain HTML but browser should treat as text (no dangerouslySetInnerHTML) |
| User sends malicious prompt to extract medicine data | Data leak | Sanitize input; AI is stateless per session; no system prompt injection detected |
| Session ID guessing | Enumeration | Use UUIDs (already); consider adding rate limit to session creation too |
| AI gives dangerous medical advice | Liability | Strong disclaimer in every prompt; log interactions for audit |

---

## 📋 Implementation Order (Recommended)

**Day 1-2:**
1. Add dependencies (1.1)
2. Update env validation (1.2)
3. Create sanitizer (1.3)
4. Create promptBuilder (1.4)

**Day 3-4:**
5. Create chat repository (2.1)
6. Create AI chat service (3.1)
7. Write unit tests for service (mock Gemini) or manual test later

**Day 5:**
8. Create chat schemas (5.1)
9. Create chat controller (4.1)
10. Create chat routes (5.2) and register (5.3)

**Day 6:**
11. Create rate limiter (6.1)
12. Create sanitize middleware (6.2)
13. Apply middleware to routes (6.3)

**Day 7:**
14. Add DB indexes if needed (8.3)
15. Manual testing checklist (8.1)
16. Fix bugs, type check (8.2)

**Total Estimated Time:** 7-10 days (depending on complexity and debugging Gemini integration)

---

## 🔄 Future Iterations (Post-Milestone 4)

- AI interaction logging table + service
- Session list endpoint (`GET /api/chat/sessions`)
- Session close/patch endpoint (`PATCH /api/chat/sessions/:id/status`)
- Streaming responses (SSE)
- Conversation summarization for long histories
- Rate limit by IP + user (dual layer)
- Allow medicine list filtering (active only, exclude removed)
- Feedback/thumbs up-down on AI responses
- Admin view of chat logs (no PII) for quality monitoring

---

## 📌 Notes

- **Database:** Prisma schema already includes ChatSession and ChatMessage — no migrations needed unless adding indexes.
- **Authentication:** Reuse existing `authenticate` middleware.
- **Error handling:** Use existing `APIError` class and `globalExceptionHandler`.
- **Response format:** Use existing `ResponseHelper`.
- **Validation:** Use existing `validate` middleware with new Zod schemas.
- **Gemini client instantiation:** Create singleton per request or reuse across calls. Consider exporting `getGeminiModel()` function to avoid repeated initialization.

---

**Plan Status:** Ready for implementation — all tasks identified, dependencies clear, risks noted.
