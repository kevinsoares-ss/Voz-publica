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
        <title>Voz Pública · Transparência Política e Fiscal</title>
        <meta
          name="description"
          content="Acompanhe agentes públicos, despesas governamentais e atuação legislativa com dados oficiais da Câmara, Senado e CGU."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-color: var(--vp-paper, #F3F5F8);
          }
          * {
            box-sizing: border-box;
          }
          /* Custom scrollbar for desktop */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.15);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.25);
          }
        `}} />
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
