import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const app = readFileSync(join(here, "..", "src", "App.jsx"), "utf8");

// The public sign-in page must not offer an account creation path without the
// consent step. Invited sign-up is the only way to reach signup mode from the
// sign-in screen, because invitations carry their own consent flow.
test("public sign-in page does not offer Create an account without an invitation", () => {
  assert.match(app, /invited && mode !== "signup" && \/\* @__PURE__ \*\/ jsx\("button", \{/);
  assert.doesNotMatch(app, /(?<!invited && )mode !== "signup" && \/\* @__PURE__ \*\/ jsx\("button", \{\s*type: "button",\s*className: "link",\s*onClick: \(\) => setMode\("signup"\)/);
});
