# vite-plugins

## How to use inlineSvgPlugin?
```ts
import { resolve } from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { inlineSvgPlugin } from "./plugins/inlineSvg";
export default defineConfig(({ command, mode }) => {
  const isProduction = mode == "production";
  return {
    plugins: [
      vue({
        isProduction,
      }),
      inlineSvgPlugin({
        assetsInlineLimit: 10 * 1024,
      }),
    ],
    resolve: {
      alias: {
        "@/": `${resolve(__dirname, "src")}/`,
      },
    },
    
    build: {
      chunkSizeWarningLimit: 500,
      cssCodeSplit: true, //css 拆分
      sourcemap: false,
      assetsInlineLimit: 5 * 1024, //小于该值 图片将打包成Base64
      minify: "terser", //是否压缩
    },
  };
});
```
Import the inlineSvgPlugin and pass in the assetsInlineLimit, which has the same meaning as build.assetsInlineLimit. If not passed, it will take the value of build.assetsInlineLimit.

The plugin currently only supports images imported with import and images referenced in the src attribute of img tags, i.e., the following two cases.

```vue
<template>
    <img src="@/assets/1.svg"/>
</template>
```

or

```ts
import svg from "@/assets/1.svg"
```

SVGs imported via CSS are not currently supported.
