import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { html } from "hono/html";

// For the sake of this example, this function's behaviour
// is irrelevant; hence the simplistic implementation.
const spellcheck = (m: string = "") => {
  const re = /(favor|color)/gi;
  const count = m.match(re)?.length ?? 0;
  const text = m.replaceAll("favor", "favour").replaceAll("color", "colour");
  return { text, count };
};

const SpellcheckComponent = ({
  text = "",
  count = 0,
}: {
  text?: string;
  count?: number;
}) => {
  const textSignal = `text`;
  const signals = JSON.stringify({ [textSignal]: text });
  return html`
    <div data-scope data-signals__scoped="${signals}">
      <input
        type="text"
        data-bind__scoped="${textSignal}"
        data-on-blur="@post(\`/spellcheck?scope=\${el.closest('[data-scope]').dataset.scope}\`, {filterSignals: \`^\${el.closest('[data-scope]').dataset.scope})\`})"
      />
      ${count > 0 &&
      html`<small>There were ${count} spelling mistakes corrected.</small>`}
    </div>
  `;
};

const app = new Hono();

app.get("/", (c) => {
  return c.html(html`
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.classless.min.css"
        />
        <script
          type="module"
          src="https://cdn.jsdelivr.net/gh/starfederation/datastar@release-candidate/bundles/datastar.js"
          defer
        ></script>
      </head>
      <body>
        <main id="main">
          <h1>Spellcheck</h1>
          <p>Write "color" or "favor" to be corrected.</p>
          ${SpellcheckComponent({})} ${SpellcheckComponent({})}
        </main>
      </body>
    </html>
  `);
});

app.post("/spellcheck", async (c) => {
  const scope = c.req.query("scope");
  if (!scope) {
    return c.status(400);
  }

  const body = await c.req.json();
  const output = spellcheck(body[scope]?.text);
  return c.html(SpellcheckComponent({ ...output }), 200, {
    "datastar-selector": `[data-scope="${scope}"]`,
  });
});

serve(app);
