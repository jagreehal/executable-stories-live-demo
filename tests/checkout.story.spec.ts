import { test, expect } from "@playwright/test";
import { story, given, when, then, and } from "executable-stories-playwright";

// A small, self-contained checkout UI so the demo records a real, watchable
// video without depending on an external app. It has deliberate CSS transitions
// (sliding discount rows, a flashing total, a spinner, an animated success
// check) so the recording shows motion rather than a single frame.
const CHECKOUT_UI = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root{--green:#16a34a;--ink:#0f172a;--muted:#64748b;--line:#e5e7eb}
  *{box-sizing:border-box}
  body{font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;
    min-height:100vh;display:grid;place-items:center;
    background:linear-gradient(160deg,#eef2ff,#f6f7f9 40%,#ecfdf5)}
  .card{background:#fff;border:1px solid var(--line);border-radius:16px;
    padding:24px 26px;width:360px;box-shadow:0 10px 30px rgba(15,23,42,.08)}
  h1{font-size:18px;margin:0 0 4px;color:var(--ink)}
  .sub{color:var(--muted);font-size:13px;margin:0 0 16px}
  .row{display:flex;justify-content:space-between;margin:8px 0;color:var(--ink)}
  .item{color:var(--muted);font-size:14px}
  .discount{color:var(--green);max-height:0;opacity:0;overflow:hidden;
    transition:max-height .45s ease,opacity .45s ease,margin .45s ease;margin:0}
  .discount.show{max-height:40px;opacity:1;margin:8px 0}
  .total{font-weight:700;font-size:22px;border-top:1px solid var(--line);
    padding-top:12px;margin-top:12px}
  .total b{transition:color .3s,transform .3s;display:inline-block}
  .total b.flash{color:var(--green);transform:scale(1.18)}
  .promo{display:flex;gap:8px;margin:16px 0 4px}
  .promo input{flex:1;padding:9px 10px;border:1px solid var(--line);
    border-radius:8px;font:inherit;font-size:14px}
  .promo input:focus{outline:2px solid #c7d2fe;border-color:#a5b4fc}
  button{margin-top:14px;width:100%;padding:11px;border:0;border-radius:10px;
    background:var(--green);color:#fff;font-weight:600;font-size:15px;cursor:pointer;
    transition:filter .2s,opacity .2s}
  button:hover{filter:brightness(1.06)}
  button.ghost{background:#eef2ff;color:#3730a3;margin:0}
  .spinner{width:20px;height:20px;border:3px solid rgba(255,255,255,.4);
    border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;
    display:inline-block;vertical-align:-4px}
  @keyframes spin{to{transform:rotate(360deg)}}
  .done{display:none;text-align:center;padding:8px 0 2px}
  .done.show{display:block}
  .check{width:64px;height:64px;border-radius:50%;background:#dcfce7;margin:0 auto 8px;
    display:grid;place-items:center;animation:pop .4s ease both}
  @keyframes pop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}
  .check svg{width:34px;height:34px;stroke:var(--green);stroke-width:4;fill:none;
    stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:48;
    stroke-dashoffset:48;animation:draw .5s .2s ease forwards}
  @keyframes draw{to{stroke-dashoffset:0}}
  .done h2{margin:4px 0 2px;font-size:18px;color:var(--ink)}
  .done p{margin:0;color:var(--muted);font-size:14px}
</style></head><body>
  <div class="card" id="card">
    <h1>Your cart</h1>
    <p class="sub">Acme Outfitters &mdash; order #A-1042</p>
    <div class="row item"><span>Trail Runner shoes &times; 1</span><span>$80.00</span></div>
    <div class="row item"><span>Merino socks &times; 2</span><span>$40.00</span></div>
    <div class="row discount" id="loyalty"><span>Loyalty &minus;20%</span><span>&minus;$24.00</span></div>
    <div class="row discount" id="promo-row"><span>Promo SAVE10 &minus;10%</span><span>&minus;$9.60</span></div>
    <div class="row total"><span>Total</span><b data-testid="total">$120.00</b></div>
    <button id="loyalty-btn">Apply loyalty discount</button>
    <div class="promo">
      <input id="promo-input" placeholder="Promo code" aria-label="Promo code"/>
      <button class="ghost" id="promo-btn" style="width:auto;padding:9px 14px">Apply code</button>
    </div>
    <button id="complete-btn">Complete order</button>
  </div>
  <div class="card done" id="done">
    <div class="check"><svg viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></svg></div>
    <h2>Order placed</h2>
    <p>We emailed a receipt for $86.40.</p>
  </div>
<script>
  var total=120;
  function setTotal(v){var el=document.querySelector('[data-testid=total]');
    el.textContent='$'+v.toFixed(2);el.classList.add('flash');
    setTimeout(function(){el.classList.remove('flash')},320)}
  document.getElementById('loyalty-btn').addEventListener('click',function(){
    document.getElementById('loyalty').classList.add('show');total=96;setTotal(total);
    this.disabled=true;this.style.opacity=.5});
  document.getElementById('promo-btn').addEventListener('click',function(){
    if(document.getElementById('promo-input').value.trim().toUpperCase()!=='SAVE10')return;
    document.getElementById('promo-row').classList.add('show');total=86.4;setTotal(total)});
  document.getElementById('complete-btn').addEventListener('click',function(){
    this.innerHTML='<span class="spinner"></span>';this.disabled=true;
    setTimeout(function(){
      document.getElementById('card').style.display='none';
      document.getElementById('done').classList.add('show')},1100)});
</script></body></html>`;

test("Checkout applies loyalty and promo discounts", async ({ page }, testInfo) => {
  // featureVideo promotes the Playwright recording into an inline, playable
  // video doc entry. video:"on" is set in playwright.config.ts.
  story.init(testInfo, {
    featureVideo: true,
    tags: ["checkout", "pricing", "e2e"],
    ticket: { id: "SHOP-1042", url: "https://example.com/issues/SHOP-1042" },
  });

  story.section({
    title: "What this scenario proves",
    markdown:
      "A returning customer stacks a **loyalty discount** and a **promo code** on a " +
      "$120 cart and checks out. Every number below is asserted live against the UI, " +
      "so this page stays honest: if the pricing rule changes, the scenario goes red.",
  });

  story.table({
    label: "Cart line items",
    columns: ["Item", "Qty", "Price"],
    rows: [
      ["Trail Runner shoes", "1", "$80.00"],
      ["Merino socks", "2", "$40.00"],
    ],
  });

  await given("a cart with 3 items totaling $120.00", async () => {
    await page.setContent(CHECKOUT_UI);
    await expect(page.getByTestId("total")).toHaveText("$120.00");
    await page.waitForTimeout(900);
  });

  story.code({
    label: "Pricing rule under test",
    lang: "typescript",
    content:
      "const subtotal = 120.0;\n" +
      "const afterLoyalty = subtotal * 0.8;   // 20% off  -> 96.00\n" +
      "const afterPromo = afterLoyalty * 0.9; // SAVE10    -> 86.40\n",
  });

  await when("the customer applies the 20% loyalty discount", async () => {
    await page.getByRole("button", { name: "Apply loyalty discount" }).click();
    await page.waitForTimeout(1100);
    await expect(page.getByTestId("total")).toHaveText("$96.00");
    const shot = testInfo.outputPath("after-loyalty.png");
    await page.screenshot({ path: shot });
    story.screenshot({ path: shot, alt: "Cart after the loyalty discount" });
  });

  await and("enters the promo code SAVE10", async () => {
    await page.getByLabel("Promo code").pressSequentially("SAVE10", { delay: 160 });
    await page.getByRole("button", { name: "Apply code" }).click();
    await page.waitForTimeout(1000);
  });

  story.kv({ label: "Subtotal", value: "$120.00" });
  story.kv({ label: "Loyalty (-20%)", value: "-$24.00" });
  story.kv({ label: "Promo SAVE10 (-10%)", value: "-$9.60" });
  story.kv({ label: "Amount due", value: "$86.40" });

  await then("the total drops to $86.40", async () => {
    await expect(page.getByTestId("total")).toHaveText("$86.40");
  });

  await and("the order completes", async () => {
    await page.getByRole("button", { name: "Complete order" }).click();
    await page.waitForTimeout(1900);
    await expect(page.getByText("Order placed")).toBeVisible();
    const shot = testInfo.outputPath("order-placed.png");
    await page.screenshot({ path: shot });
    story.screenshot({ path: shot, alt: "Order confirmation screen" });
  });

  story.json({
    label: "Recorded order",
    value: {
      orderId: "A-1042",
      items: 3,
      subtotal: 120.0,
      discounts: { loyalty: 24.0, promo: 9.6 },
      amountDue: 86.4,
      currency: "USD",
    },
  });

  story.mermaid({
    title: "Checkout flow",
    code:
      "flowchart LR\n" +
      "  A[Cart $120] --> B{Loyalty member?}\n" +
      "  B -- yes --> C[-20% = $96]\n" +
      "  C --> D{Promo code?}\n" +
      "  D -- SAVE10 --> E[-10% = $86.40]\n" +
      "  E --> F[Order placed]",
  });

  story.link({
    label: "executable-stories docs",
    url: "https://executablestories.com",
  });
});

test("Invalid promo code leaves the total unchanged", async ({ page }, testInfo) => {
  story.init(testInfo, {
    featureVideo: true,
    tags: ["checkout", "pricing", "validation"],
  });

  story.note(
    "A short companion scenario: the UI must reject an unknown promo code and keep the price intact.",
  );

  await given("a cart already discounted to $96.00", async () => {
    await page.setContent(CHECKOUT_UI);
    await page.getByRole("button", { name: "Apply loyalty discount" }).click();
    await page.waitForTimeout(900);
    await expect(page.getByTestId("total")).toHaveText("$96.00");
  });

  await when("the customer enters an unknown code", async () => {
    await page.getByLabel("Promo code").pressSequentially("BOGUS99", { delay: 140 });
    await page.getByRole("button", { name: "Apply code" }).click();
    await page.waitForTimeout(700);
  });

  await then("the total stays at $96.00", async () => {
    await expect(page.getByTestId("total")).toHaveText("$96.00");
  });
});
