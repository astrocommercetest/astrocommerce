import { auth } from "./auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith("/api/auth")) {
    return next();
  }
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });
  context.locals.user = session?.user ?? null;
  context.locals.session = session?.session ?? null;
  return next();
});
