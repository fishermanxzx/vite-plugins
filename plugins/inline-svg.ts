import fs from "fs";
import { Plugin } from "vite";
type Options = {
  assetsInlineLimit?: number;
};
const assetsMap = new Map<string, string>();
function svgToDataURL(content: Buffer): string {
  const stringContent = content.toString();
  // If the SVG contains some text, any transformation is unsafe, and given that double quotes would then
  // need to be escaped, the gain to use a data URI would be ridiculous if not negative
  if (stringContent.includes("<text")) {
    return `data:image/svg+xml;base64,${content.toString("base64")}`;
  } else {
    return (
      "data:image/svg+xml," +
      stringContent
        .trim()
        .replaceAll('"', "'")
        .replaceAll("%", "%25")
        .replaceAll("#", "%23")
        .replaceAll("<", "%3c")
        .replaceAll(">", "%3e")
        // Spaces are not valid in srcset it has some use cases
        // it can make the uncompressed URI slightly higher than base64, but will compress way better
        // https://github.com/vitejs/vite/pull/14643#issuecomment-1766288673
        .replaceAll(/\s+/g, "%20")
    );
  }
}
export function inlineSvgPlugin(options?: Options): Plugin {
  let assetsInlineLimit = 0;
  // 标识
  const tag = "?svg-to-inline";
  return {
    name: "vite-plugin-inline-svg",
    enforce: "pre",
    apply: "build",
    configResolved(config) {
      if (typeof options?.assetsInlineLimit == 'number') {
        assetsInlineLimit = options.assetsInlineLimit;
        return;
      }
      if (typeof config.build?.assetsInlineLimit == 'number') {
        assetsInlineLimit = config.build.assetsInlineLimit;
        return;
      }
    },
    resolveId(source, importer) {
      if (assetsInlineLimit == 0) return null;
      if (!source.endsWith(".svg") || !source.includes("src")) return null;
      return this.resolve(source, importer, { skipSelf: true }).then(
        (resolved) => {
          if (resolved) {
            const fileBuffer = fs.readFileSync(resolved.id);
            // 判断大小
            if (fileBuffer.byteLength > assetsInlineLimit) return null;
            const resolveId = resolved.id + tag;
            assetsMap.set(resolveId, svgToDataURL(fileBuffer));
            return {
              id: resolveId,
            };
          }
          return null;
        }
      );
    },
    load(id) {
      if (!id.endsWith(tag)) return null;
      const uriSvg = assetsMap.get(id);
      if (!uriSvg) return null;
      return `export default ${JSON.stringify(uriSvg)}`;
    },
  };
}
