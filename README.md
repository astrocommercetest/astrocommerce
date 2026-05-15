# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🔐 Authentication

Auth is handled by [better-auth](https://better-auth.com) with email/password and mandatory email verification.

### How it works

1. User registers at `/register` with email and password
2. A verification email is sent — click the link to confirm the address and be signed in automatically
3. Subsequent logins at `/login` require a verified email; unverified accounts get a 403 error
4. Session is stored in a cookie and populated into `Astro.locals.user` / `Astro.locals.session` on every request via middleware

### Key files

| File | Role |
| :--- | :--- |
| `src/features/auth/auth.ts` | better-auth server instance (DB adapter, email config) |
| `src/features/auth/middleware.ts` | Reads session cookie and populates `Astro.locals` |
| `src/lib/auth-client.ts` | React client (`authClient`) for use in browser components |
| `src/lib/email.ts` | Nodemailer transport (Mailpit in dev, swap for SMTP in prod) |
| `src/pages/api/auth/[...all].ts` | Catch-all API handler for all `/api/auth/*` requests |
| `src/features/auth/LoginForm.tsx` | Login form island |
| `src/features/auth/RegisterForm.tsx` | Register form island with password strength indicator |

### Environment variables

```txt
BETTER_AUTH_SECRET=   # at least 32 chars — generate with: openssl rand -base64 32
BETTER_AUTH_URL=      # base URL of the app, e.g. http://localhost:4321
```

### Email in development

`npm run dev` starts [Mailpit](https://mailpit.axllent.org) alongside the Astro dev server. All outgoing emails are captured locally — open `http://localhost:8025` to browse them. No emails are delivered externally.

To switch to a real SMTP provider in production, update the transport in `src/lib/email.ts`.

### Accessing the session server-side

```astro
---
const { user } = Astro.locals;
if (!user) return Astro.redirect("/login");
---
<p>Ciao, {user.name}</p>
```

### Accessing the session client-side

```tsx
import { authClient } from "@/lib/auth-client";

const { data: session } = authClient.useSession();
```

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
