import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as cheerio from "cheerio";
import { addDocumentToWorkspace } from "../pinecone.service.js";

export const createUrlFetcherTool = (workspaceId?: string) => {
  return new DynamicStructuredTool({
    name: "url_fetcher",
    description:
      "Fetches and extracts text content from a given URL. Use this when the user provides a direct link or asks you to read/summarize a specific webpage. Input should be a valid HTTP/HTTPS URL.",
    schema: z.object({
      url: z
        .string()
        .url()
        .describe("The complete URL to fetch (must start with http:// or https://)"),
    }),
    func: async ({ url }) => {
      try {
        // Validate URL format
        const urlObj = new URL(url);
        if (!["http:", "https:"].includes(urlObj.protocol)) {
          return JSON.stringify({
            error: "Invalid URL protocol. Only HTTP and HTTPS are supported.",
          });
        }

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; URLFetcher/1.0)",
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            if (response.status === 403) {
              return JSON.stringify({
                error: "Access denied. The website blocked our request.",
              });
            }
            return JSON.stringify({
              error: `Failed to fetch URL: HTTP ${response.status}`,
            });
          }

          const html = await response.text();
          const $ = cheerio.load(html);

          // Remove scripts, styles, and other non-content elements
          // Enhanced sanitization to remove embedded objects, iframes, and hidden elements to prevent invisible injection attacks
          $("script, style, nav, header, footer, aside, noscript, iframe, object, embed, meta, link, base").remove();
          
          // Remove elements that appear to be hidden via standard inline styles or attributes
          $("[hidden], [style*='display: none'], [style*='display:none'], input[type='hidden']").remove();

          // Extract text from body
          let content = $("body").text();

          // Extract title
          const title = $("title").text() || "No title";

          // Clean up whitespace
          content = content
            .replace(/\s+/g, " ")
            .replace(/\n+/g, "\n")
            .trim();

          // Limit content length
          const maxLength = 10000;
          if (content.length > maxLength) {
           content =
              content.substring(0, maxLength) +
              "...\n[Content truncated due to length]";
          }

          // Format output clearly with delimiters for the LLM
          const formattedContent = `<source url="${url}">\n<title>${title.trim()}</title>\n<content>\n${content}\n</content>\n</source>`;

          if (workspaceId && content.length > 0) {
            await addDocumentToWorkspace(workspaceId, formattedContent, title.trim()).catch(e => 
              console.error("[UrlFetcher] External fetch pinecone ingest error:", e)
            );
          } else if (workspaceId) {
             console.warn(`[UrlFetcher] Skipped Pinecone ingestion for URL: ${url} due to empty content.`);
          }

          return JSON.stringify({
            url,
            title: title.trim(),
            content: formattedContent,
            length: formattedContent.length,
          });
        } catch (fetchError: unknown) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string; name?: string };

        // Handle timeout
        if (err.name === "AbortError") {
          return JSON.stringify({
            error: "Request timed out after 5 seconds. The website was too slow to respond.",
          });
        }

        // Handle DNS errors
        if (err.code === "ENOTFOUND" || err.message?.includes("ENOTFOUND")) {
          return JSON.stringify({
            error: "URL not found. The domain does not exist.",
          });
        }

        // Handle connection refused
        if (err.code === "ECONNREFUSED") {
          return JSON.stringify({
            error: "Connection refused. The server is not accepting connections.",
          });
        }

        return JSON.stringify({
          error: `Failed to fetch URL: ${err.message || "Unknown error"}`,
        });
      }
    },
  });
};
