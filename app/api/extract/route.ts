import { extractArticleFromHtml } from "@/lib/article-extraction";

const MAX_HTML_BYTES = 3_000_000;
const MAX_REDIRECTS = 5;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: unknown };
    if (typeof body.url !== "string") return errorResponse("请输入有效的文章网址", 400);
    const requestedUrl = parsePublicHttpUrl(body.url);
    const { html, finalUrl } = await fetchHtml(requestedUrl);
    return Response.json(extractArticleFromHtml(html, finalUrl.href));
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法导入这个网页";
    const status = message.includes("超时") ? 504 : 422;
    return errorResponse(message, status);
  }
}

async function fetchHtml(initialUrl: URL) {
  let currentUrl = initialUrl;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    parsePublicHttpUrl(currentUrl.href);
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(12_000),
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "JustRead/0.1 (+local reader)",
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") throw new Error("网页请求超时");
      throw new Error("无法连接这个网页");
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("网页跳转地址无效");
      currentUrl = parsePublicHttpUrl(new URL(location, currentUrl).href);
      continue;
    }
    if (!response.ok) throw new Error(`网页返回错误（${response.status}）`);

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("这个网址不是普通文章网页");
    }
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_HTML_BYTES) throw new Error("网页内容过大，暂时无法导入");
    const html = await response.text();
    if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) throw new Error("网页内容过大，暂时无法导入");
    return { html, finalUrl: currentUrl };
  }
  throw new Error("网页跳转次数过多");
}

function parsePublicHttpUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("请输入完整的 http 或 https 网址");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("只支持 http 或 https 网址");
  if (url.username || url.password) throw new Error("网址不能包含用户名或密码");
  if (isPrivateHostname(url.hostname)) throw new Error("不能导入本机或局域网地址");
  return url;
}

function isPrivateHostname(hostname: string) {
  const value = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (value === "localhost" || value.endsWith(".localhost") || value.endsWith(".local")) return true;
  if (value === "::1" || value === "0:0:0:0:0:0:0:1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:")) return true;
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168);
}

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status });
}
