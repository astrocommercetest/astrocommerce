/// <reference path="./.astro/types.d.ts" />

type AuthUser = typeof import("./src/features/auth/auth").auth.$Infer.Session.user;
type AuthSession = typeof import("./src/features/auth/auth").auth.$Infer.Session.session;

declare namespace App {
  interface Locals {
    user: AuthUser | null;
    session: AuthSession | null;
  }
}
