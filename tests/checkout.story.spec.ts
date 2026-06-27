import { test, expect } from "@playwright/test";
import { story, given, when, then } from "executable-stories-playwright";

// A tiny self-contained checkout UI so the demo records a real video without
// depending on an external app.
const CHECKOUT_UI = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font:16px/1.5 system-ui;margin:0;display:grid;place-items:center;height:100vh;background:#f6f7f9}
  .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px 28px;width:320px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
  h1{font-size:18px;margin:0 0 12px} .row{display:flex;justify-content:space-between;margin:6px 0}
  .total{font-weight:700;font-size:20px;border-top:1px solid #e5e7eb;padding-top:10px;margin-top:10px}
  button{margin-top:16px;width:100%;padding:10px;border:0;border-radius:8px;background:#16a34a;color:#fff;font-weight:600;cursor:pointer}
</style></head><body><div class="card"><h1>Your cart</h1>
  <div class="row"><span>3 items</span><span>$120.00</span></div>
  <div class="row" id="discount" style="color:#16a34a;display:none"><span>Loyalty 20%</span><span>-$24.00</span></div>
  <div class="row total"><span>Total</span><span data-testid="total">$120.00</span></div>
  <button>Apply loyalty discount</button>
</div><script>
  document.querySelector('button').addEventListener('click',()=>{
    document.getElementById('discount').style.display='flex';
    document.querySelector('[data-testid=total]').textContent='$96.00';
  });
</script></body></html>`;

test("Checkout applies the loyalty discount", async ({ page }, testInfo) => {
  // featureVideo promotes the Playwright recording into an inline video entry.
  story.init(testInfo, { featureVideo: true, tags: ["checkout", "pricing"] });

  await given("a cart with 3 items totaling $120.00", async () => {
    await page.setContent(CHECKOUT_UI);
    await expect(page.getByTestId("total")).toHaveText("$120.00");
  });

  await when("the customer applies a 20% loyalty discount", async () => {
    await page.getByRole("button", { name: "Apply loyalty discount" }).click();
    const shot = testInfo.outputPath("cart-after-discount.png");
    await page.screenshot({ path: shot });
    story.screenshot({ path: shot, alt: "Cart with the loyalty discount applied" });
  });

  await then("the total drops to $96.00", async () => {
    await expect(page.getByTestId("total")).toHaveText("$96.00");
  });
});
