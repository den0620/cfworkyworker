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

        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;

        while ((match = imgRegex.exec(text)) !== null) {
          const imgUrl = match[1];
          const absoluteImgUrl = new URL(imgUrl, targetUrl).toString();
          const imgResponse = await fetch(absoluteImgUrl);
          const imgArrayBuffer = await imgResponse.arrayBuffer();
          const base64String = arrayBufferToBase64(imgArrayBuffer);
          const contentType = imgResponse.headers.get("content-type");
          const dataUri = `data:${contentType};base64,${base64String}`;
          text = text.replace(imgUrl, dataUri);
        }

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

    function arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }

    if (request.method !== "GET") return methodNotAllowed(request);
    return fetchAndRewrite(request);
  }
};
