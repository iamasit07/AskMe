import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { TavilySearch } from "@langchain/tavily";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (oldMessages, newMessages) => oldMessages.concat(newMessages),
    default: () => [],
  }),
});

type AgentStateType = typeof AgentState.State;

export interface ChatAgentOptions {
  type: "token" | "tool_start" | "tool_end" | "message" | "done" | "error";
  data: unknown;
}

export class ChatAgent {
  private graph: any;
  private model: ChatOpenAI;
  private tools: TavilySearch[];
  private initalized: boolean = false;

  constructor() {
    this.model = new ChatOpenAI({
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      apiKey: process.env.OPENROUTER_API_KEY || "",
      modelName: "openai/gpt-4o",
      streaming: true,
      temperature: 0.7,
    });

    this.tools = [
      new TavilySearch({
        maxResults: 3,
        tavilyApiKey: process.env.TAVILY_API_KEY || "",
      }),
    ];
  }

  private async initialize(): Promise<void> {
    if (this.initalized) return;

    const modelWithTools = this.model.bindTools(this.tools);
    const workflow = new StateGraph(AgentState);

    const AgentNode = async (
      state: AgentStateType,
    ): Promise<Partial<AgentStateType>> => {
      const response = await modelWithTools.invoke(state.messages);
      return {
        messages: [response],
      };
    };

    const toolNode = new ToolNode(this.tools);

    const shouldContinue = (state: AgentStateType): typeof END | "tools" => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (
        lastMessage &&
        "tool_calls" in lastMessage &&
        (lastMessage as AIMessage).tool_calls?.length
      ) {
        return "tools";
      }
      return END;
    };

    workflow.addNode("agent", AgentNode);
    workflow.addNode("tools", toolNode);

    (workflow as any).addEdge(START, "agent");
    (workflow as any).addConditionalEdge("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    });
    (workflow as any).addEdge("tools", "agent");

    this.graph = (workflow as any).compile();
    this.initalized = true;
  }

  async *stream(messages: BaseMessage[]): AsyncGenerator<ChatAgentOptions> {
    await this.initialize();

    if (!this.graph) {
      yield { type: "error", data: { message: "Agent not initialized" } };
      return;
    }

    try {
      const eventStream = await (this.graph as any).streamEvents(
        { messages },
        { version: "v2" },
      );

      for await (const event of eventStream) {
        if (event.event === "on_chat_model_stream") {
          const chunk = event.data?.chunk;
          if (chunk?.content) {
            yield {
              type: "token",
              data: chunk.content,
            };
          }
        } else if (event.event === "on_tool_start") {
          yield {
            type: "tool_start",
            data: {
              toolName: event.name,
              input: event.data?.input,
            },
          };
        } else if (event.event === "on_tool_end") {
          yield {
            type: "tool_end",
            data: {
              toolName: event.name,
              output: event.data?.output,
            },
          };
        }
      }

      yield {
        type: "done",
        data: {
          success: true,
        },
      };
    } catch (error: any) {
      yield {
        type: "error",
        data: {
          message:
            error instanceof Error
              ? error.message
              : "Unknown error occurred during agent execution",
        },
      };
    }
  }

  async invoke(messages: BaseMessage[]): Promise<BaseMessage[]> {
    await this.initialize();

    if (!this.graph) {
      throw new Error("Agent not initialized");
    }

    const result = await (this.graph as any).invoke({ messages });
    return result.messages;
  }
}

export function convertToLangChainMessages(
  messages: Array<{
    role: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>,
): BaseMessage[] {
  return messages.map((msg) => {
    switch (msg.role) {
      case "user":
        return new HumanMessage(msg.content);
      case "assistant":
        return new AIMessage(msg.content);
      case "tool":
        return new ToolMessage({
          content: msg.content,
          tool_call_id: (msg.metadata?.toolCallId as string) || "",
        });
      default:
        return new HumanMessage(msg.content);
    }
  });
}

let angentInstance: ChatAgent | null = null;

export function getChatAgent(): ChatAgent {
  if (!angentInstance) {
    angentInstance = new ChatAgent();
  }
  return angentInstance;
}
