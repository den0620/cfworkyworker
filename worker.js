export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const queryParams = url.search;

    const targetUrl = `https://example.com${path}${queryParams}`;

    async function fetchAndRewrite(request) {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers
      });

      if (response.headers.get("content-type") && response.headers.get("content-type").includes("text/html")) {
        let text = await response.text();

        text = text.replace(/<img/g, '<img loading="lazy"');

        return new Response(text, {
          status: response.status,
          headers: response.headers
        });
      } else {
        return response;
      }
    }

    async function methodNotAllowed(request) {
      return new Response(`Method ${request.method} not allowed.`, {
        status: 405,
        headers: {
          Allow: "GET"
        }
      });
    }

    if (request.method !== "GET") return methodNotAllowed(request);
    return fetchAndRewrite(request);
  }
};
