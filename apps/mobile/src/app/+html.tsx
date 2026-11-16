import type { PropsWithChildren } from "react";
import {
  ScrollViewStyleReset,
  useServerDocumentContext,
} from "expo-router/html";

export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } =
    useServerDocumentContext();

  return (
    <html {...htmlAttributes} lang="pt-BR">
      <head>
        {headNodes}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
