import { handleRequest } from "@vercel/react-router/entry.server";
import type { AppLoadContext, EntryContext } from "react-router";

export default async function vercelRequestHandler(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext?: AppLoadContext,
): Promise<Response> {
  return handleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
    loadContext,
  );
}
