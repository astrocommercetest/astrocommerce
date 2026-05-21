import { auth } from "@/auth";
import type { APIRoute } from "astro";

const handler: APIRoute = async (ctx) => auth.handler(ctx.request);

export const GET = handler;
export const POST = handler;
