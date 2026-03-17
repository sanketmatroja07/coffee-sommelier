/**
 * Embeddable loader: injects iframe for Coffee Sommelier widget.
 * Usage: <script src="https://.../sommelier-widget.js" data-merchant="MERCHANT_ID" data-api="https://api.example.com"></script>
 */
(function () {
  const script = document.currentScript as HTMLScriptElement;
  const merchantId = script?.getAttribute("data-merchant") || "default";
  const apiBase = script?.getAttribute("data-api") || "http://localhost:8000";
  const widgetUrl = script?.getAttribute("data-widget-url") || `${apiBase.replace(/\/$/, "")}/widget/embed.html`;

  const iframe = document.createElement("iframe");
  iframe.src = `${widgetUrl}?merchant=${encodeURIComponent(merchantId)}&api=${encodeURIComponent(apiBase)}`;
  iframe.style.cssText =
    "border:none;width:100%;min-height:400px;max-width:480px;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.12);";
  iframe.title = "Coffee Sommelier";

  const container = document.createElement("div");
  container.className = "coffee-sommelier-widget";
  container.style.cssText = "font-family:system-ui,sans-serif;";
  container.appendChild(iframe);

  const target = script?.nextElementSibling || script?.parentElement;
  if (target?.parentNode) {
    target.parentNode.insertBefore(container, target.nextSibling || target);
  } else {
    document.body.appendChild(container);
  }
})();
