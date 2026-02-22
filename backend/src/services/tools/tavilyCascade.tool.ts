import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { tavily } from "@tavily/core";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";

function detectIntent(query: string): string {
  const q = query.toLowerCase();

  if (/news|today|latest|breaking|announced|inaugurated|launched/i.test(q)) return "news";
  if (/how to|error|fix|code|api|library|function|syntax|debug/i.test(q)) return "technical";
  if (/research|study|paper|journal|findings|published/i.test(q)) return "research";
  if (/stock|market|price|revenue|earnings|investment|fund/i.test(q)) return "finance";
  if (/law|legal|act|section|court|judgment|regulation/i.test(q)) return "legal";
  if (/buy|review|compare|best|product|rating/i.test(q)) return "ecommerce";

  return "general";
}

function meetsThreshold(results: any[], minScore: number, minCount: number): boolean {
  const passing = results.filter(r => (r.score || 0) >= minScore);
  return passing.length >= minCount;
}

function deduplicateByUrl(results: any[]): any[] {
  const seen = new Set<string>();
  return results.filter(r => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

function decomposeQuery(query: string, intent: string): string[] {
  const core = query.trim();

  const decompositions: Record<string, string[]> = {
    news: [`${core} latest update`, `${core} announcement`, `${core} report`],
    technical: [`${core} example`, `${core} documentation`, `how to ${core}`],
    research: [`${core} study findings`, `${core} published paper`, `${core} review`],
    finance: [`${core} analysis`, `${core} performance`, `${core} forecast`],
    legal: [`${core} ruling`, `${core} act section`, `${core} judgment`],
    ecommerce: [`${core} review`, `best ${core}`, `${core} comparison`],
    general: [`${core} explained`, `${core} overview`, `what is ${core}`],
  };

  return decompositions[intent] || decompositions["general"] || [];
}

async function predictLikelyUrls(llm: ChatGoogleGenerativeAI, query: string, intent: string, today: string): Promise<string[]> {
  const prompt = `
    Query: "${query}"
    Intent type: ${intent}
    Today's date: ${today}

    Predict 3 specific URLs where the answer to this query is most likely to be found.
    Return only full valid URLs starting with https://, one per line, no explanation.
  `;

  try {
    const response = await llm.invoke(prompt);
    const content = typeof response.content === "string" ? response.content : "";
    return content.trim().split("\\n").filter(url => url.trim().startsWith("https://"));
  } catch (err) {
    console.error("Failed to predict URLs", err);
    return [];
  }
}

function buildResponse(results: any[], stage: string, intent: string): string {
  const deduped = deduplicateByUrl(results);
  const sorted = deduped.sort((a, b) => (b.score || 0) - (a.score || 0));

  return JSON.stringify({
    found: true,
    stage,
    intent,
    results: sorted
  });
}

export function createTavilyCascadeTool(llm: ChatGoogleGenerativeAI) {
  const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY || "" });

  return new DynamicStructuredTool({
    name: "universal_web_search",
    description: "A highly robust, multi-stage cascaded web search that prevents 'no results' errors. Use this to lookup real-world, current, or domain-specific information on the internet.",
    schema: z.object({
      query: z.string().describe("The search query to look up securely on the internet"),
    }),
    func: async ({ query }, _runManager, _config) => {
      const config = (_config || _runManager) as any;
      const intent = detectIntent(query);
      const today = new Date().toISOString().split("T")[0] as string;
      
      console.log(`[TavilyCascade] Detected intent: ${intent} for query: ${query}`);
      await dispatchCustomEvent("cascade_status", { message: `Detecting Intent: ${intent}...` }, config);

      let allCollectedResults: any[] = [];

      // STAGE 1: Ultra-fast broad search
      console.log("[TavilyCascade] Stage 1: Ultra-fast broad search...");
      await dispatchCustomEvent("cascade_status", { message: "Stage 1: Performing ultra-fast broad search..." }, config);
      try {
        const stage1 = await tavilyClient.search(query, {
          searchDepth: "basic",
          maxResults: 5,
        });
        
        // tavily core return type has results at .results or directly as array depending on version, check carefully
        const results1 = stage1.results || (Array.isArray(stage1) ? stage1 : []);
        allCollectedResults.push(...results1);
        if (meetsThreshold(allCollectedResults, 0.7, 2)) {
          return buildResponse(allCollectedResults, "Stage 1", intent);
        }
      } catch (e) {
        console.error("[TavilyCascade] Stage 1 error", e);
      }

      // STAGE 2: Advanced deep search
      console.log("[TavilyCascade] Stage 2: Advanced deep search...");
      await dispatchCustomEvent("cascade_status", { message: "Stage 2: Elevating to advanced deep search with content extraction..." }, config);
      try {
        const stage2 = await tavilyClient.search(query, {
          searchDepth: "advanced",
          includeRawContent: "text",
          maxResults: 7,
        });
        
        const results2 = stage2.results || (Array.isArray(stage2) ? stage2 : []);
        allCollectedResults.push(...results2);
        const deduped2 = deduplicateByUrl(allCollectedResults);
        if (meetsThreshold(deduped2, 0.6, 2)) {
          return buildResponse(deduped2, "Stage 2", intent);
        }
      } catch (e) {
        console.error("[TavilyCascade] Stage 2 error", e);
      }

      // STAGE 3: Sub-query decomposition
      console.log("[TavilyCascade] Stage 3: Sub-query decomposition...");
      await dispatchCustomEvent("cascade_status", { message: "Stage 3: Decomposing into sub-queries for parallel context fetching..." }, config);
      const subQueries = decomposeQuery(query, intent);
      try {
        const stage3Promises = subQueries.map(q => tavilyClient.search(q, {
          searchDepth: "basic",
          maxResults: 3,
        }));
        
        const stage3ResultsList = await Promise.allSettled(stage3Promises);
        
        stage3ResultsList.forEach(result => {
          if (result.status === "fulfilled") {
            const data = result.value.results || (Array.isArray(result.value) ? result.value : []);
            allCollectedResults.push(...data);
          }
        });
        
        const deduped3 = deduplicateByUrl(allCollectedResults);
        if (meetsThreshold(deduped3, 0.5, 2)) {
          return buildResponse(deduped3, "Stage 3", intent);
        }
      } catch (e) {
        console.error("[TavilyCascade] Stage 3 error", e);
      }

      // STAGE 4: Relaxed Advanced Fallback (Replacing Domain-Targeted)
      console.log("[TavilyCascade] Stage 4: Relaxed advanced search...");
      await dispatchCustomEvent("cascade_status", { message: "Stage 4: Relaxing advanced thresholds..." }, config);
      try {
        const stage4 = await tavilyClient.search(query, {
          searchDepth: "advanced",
          maxResults: 5,
        });
        
        const results4 = stage4.results || (Array.isArray(stage4) ? stage4 : []);
        allCollectedResults.push(...results4);
        const deduped4 = deduplicateByUrl(allCollectedResults);
        if (meetsThreshold(deduped4, 0.4, 1)) {
          return buildResponse(deduped4, "Stage 4", intent);
        }
      } catch (e) {
        console.error("[TavilyCascade] Stage 4 error", e);
      }

      // STAGE 5: Raw URL extraction
      console.log("[TavilyCascade] Stage 5: Direct URL extraction...");
      await dispatchCustomEvent("cascade_status", { message: "Stage 5: High-confidence fallback using AI prediction & raw extraction..." }, config);
      try {
        const candidateUrls = await predictLikelyUrls(llm, query, intent, today);
        if (candidateUrls.length > 0) {
          const stage5 = await tavilyClient.extract(candidateUrls);
          const extractedResults = stage5.results || (Array.isArray(stage5) ? stage5 : []);
          
          const validExtracted = extractedResults.filter((r: any) => (r.rawContent?.length || 0) > 200 || (r.raw_content?.length || 0) > 200);
          
          allCollectedResults.push(...validExtracted);
          const deduped5 = deduplicateByUrl(allCollectedResults);
          if (deduped5.length >= 1) {
            return buildResponse(deduped5, "Stage 5", intent);
          }
        }
      } catch (e) {
        console.error("[TavilyCascade] Stage 5 error", e);
      }

      // ALL STAGES FAILED
      return JSON.stringify({
        found: false,
        intent,
        stagesRun: 5,
        message: `I ran 5 search strategies for "${query}" and couldn't find confident results. Try sharing a direct URL or rephrasing your query.`
      });
    },
  });
}
