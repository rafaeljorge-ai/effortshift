import readline from "node:readline";
// Deterministic RPC simulation only: no model, account, network or credentials.
let turnSequence = 0;
const send = (m) => process.stdout.write(JSON.stringify(m) + "\n");
readline.createInterface({ input: process.stdin }).on("line", (line) => {
  const m = JSON.parse(line);
  if (m.id === undefined) return;
  if (!m.method) {
    if (m.id === "approval")
      send({ method: "fixture/approvalResult", params: m.result ?? m.error });
    return;
  }
  let result = {};
  switch (m.method) {
    case "hang":
      return;
    case "disconnect":
      process.exit(0);
      break;
    case "initialize":
      result = { userAgent: "fixture" };
      break;
    case "model/list":
      result = {
        data: [
          {
            id: "alias",
            model: "fixture-model",
            displayName: "Fixture",
            isDefault: true,
            supportedReasoningEfforts: ["low", "medium", "high"].map(
              (reasoningEffort) => ({ reasoningEffort }),
            ),
          },
        ],
        nextCursor: null,
      };
      break;
    case "account/rateLimits/read":
      result = {
        rateLimits: {
          primary: { usedPercent: 12, resetsAt: 123, windowDurationMins: 300 },
          secondary: null,
        },
      };
      break;
    case "thread/start":
      result = { thread: { id: "thread-1" } };
      break;
    case "turn/start": {
      const turnId = `turn-${++turnSequence}`;
      const itemId = `answer-${turnSequence}`;
      result = { turn: { id: turnId } };
      send({ method: "fixture/turnSubmitted", params: m.params });
      if (m.params.input[0].text === "early") {
        send({
          method: "turn/started",
          params: { threadId: "thread-1", turn: { id: turnId } },
        });
        send({
          method: "turn/completed",
          params: {
            threadId: "thread-1",
            turn: { id: turnId, status: "completed" },
          },
        });
        break;
      }
      setTimeout(() => {
        if (m.params.input[0].text === "hold") return;
        send({
          method: "item/agentMessage/delta",
          params: { threadId: "thread-1", itemId, delta: "Olá " },
        });
        send({
          method: "item/agentMessage/delta",
          params: { threadId: "thread-1", itemId, delta: "mundo" },
        });
        send({
          method: "item/completed",
          params: {
            threadId: "thread-1",
            item: { id: itemId, type: "agentMessage", text: "Olá mundo" },
          },
        });
        send({
          method: "thread/tokenUsage/updated",
          params: {
            threadId: "thread-1",
            tokenUsage: {
              total: {
                inputTokens: 10,
                cachedInputTokens: 2,
                outputTokens: 5,
                totalTokens: 15,
              },
              last: { totalTokens: 15 },
              modelContextWindow: 100,
            },
          },
        });
        send({
          method: "turn/completed",
          params: {
            threadId: "thread-1",
            turn: { id: turnId, status: "completed" },
          },
        });
      }, 30);
      break;
    }
    case "turn/interrupt":
      send({
        method: "turn/completed",
        params: {
          threadId: "thread-1",
          turn: { id: m.params.turnId, status: "interrupted" },
        },
      });
      break;
    case "fixture/approval":
      send({
        id: "approval",
        method: m.params.method,
        params: { threadId: "thread-1", command: "safe fixture" },
      });
      break;
    default:
      break;
  }
  send({ id: m.id, result });
});
