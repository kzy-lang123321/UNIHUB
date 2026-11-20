import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import * as esbuild from "esbuild";
const root = process.cwd();
fs.mkdirSync(".tools", { recursive: true });
const settings = fs.readFileSync(".env", "utf8");
const stateRoot =
  process.env.LIBRARY_STATE_ROOT ||
  settings.match(/^LIBRARY_STATE_ROOT=(.+)$/m)?.[1]?.trim() ||
  ".library";
const state = JSON.parse(
  fs.readFileSync(path.join(stateRoot, "manifest.json"), "utf8"),
);
const resources = Object.values(state.resources).filter(
  (r) => r.source === "provided",
);
fs.writeFileSync(
  ".tools/library-ui-data.json",
  JSON.stringify({
    resources,
    storageProvider: "local",
    cloudUploads: false,
    importIssues: state.importIssues,
  }),
);
const previewRow =
  resources.find(
    (r) =>
      r.relativePath.includes("ICT Fazal ali CH 4/Lecture # 01.pdf") &&
      r.hasPreview,
  ) || resources.find((r) => r.hasPreview);
fs.writeFileSync(
  ".tools/library-ui-preview-path.txt",
  previewRow ? state.privateFiles[previewRow.id].previewPath : "",
);
fs.writeFileSync(
  ".tools/library-ui-client.ts",
  `import data from './library-ui-data.json'; import {libraryStats,publicationError} from '../src/features/library/policy';
let resources=data.resources;
export const libraryUrl='';
export const getLibrary=async()=>({...data,resources,stats:libraryStats(resources)});
export const updateResource=async(current,changes)=>{const next={...current,...changes,version:current.version+1};if(next.published){const error=publicationError(next);if(error)throw new Error(error);}resources=resources.map(r=>r.id===next.id?next:r);return next;};
export const uploadOriginal=async()=>{throw new Error('UI fixture does not write real files');};
export const libraryRequest=async()=>({path:'/preview.webp'}); export const fileLink=async()=>'/original.pdf';`,
);
fs.writeFileSync(
  ".tools/library-ui-stubs.ts",
  `export const router={push(){},replace(){}}; export const getDocumentAsync=async()=>({canceled:true}); export class MMKV{};`,
);
fs.writeFileSync(
  ".tools/library-ui-animation.ts",
  `import {View} from 'react-native'; export default {View}; export const ReduceMotion={System:'system'}; export const FadeIn={duration:()=>({reduceMotion:()=>undefined})};`,
);
fs.writeFileSync(
  ".tools/library-ui-entry.tsx",
  `import React from 'react'; import {createRoot} from 'react-dom/client'; import {SafeAreaProvider} from 'react-native-safe-area-context'; import {QueryClient,QueryClientProvider} from '@tanstack/react-query'; import {AdminLibrary} from '../src/features/library/AdminLibrary'; createRoot(document.getElementById('root')).render(<SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:1200,height:900},insets:{top:0,left:0,right:0,bottom:0}}}><QueryClientProvider client={new QueryClient()}><AdminLibrary/></QueryClientProvider></SafeAreaProvider>);`,
);
const offlineEntry = `import {saveDocument,openSavedDocument} from '../src/features/library/documents.web'; import data from './library-ui-data.json'; window.__libraryOffline={saveDocument,openSavedDocument,resource:data.resources.find(r=>r.relativePath.includes('ICT Fazal ali CH 4/Lecture # 01.pdf'))};`;
fs.appendFileSync(".tools/library-ui-entry.tsx", offlineEntry);
await esbuild.build({
  entryPoints: [".tools/library-ui-entry.tsx"],
  outfile: ".tools/library-ui-bundle.js",
  bundle: true,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  define: {
    "process.env": "{}",
    __DEV__: "true",
    "process.env.NODE_ENV": '"development"',
  },
  alias: {
    "react-native": "react-native-web",
    "react-native-mmkv": path.resolve(".tools/library-ui-stubs.ts"),
    "react-native-reanimated": path.resolve(".tools/library-ui-animation.ts"),
    "expo-document-picker": path.resolve(".tools/library-ui-stubs.ts"),
  },
  resolveExtensions: [
    ".web.tsx",
    ".web.ts",
    ".tsx",
    ".ts",
    ".web.js",
    ".js",
    ".json",
  ],
  plugins: [
    {
      name: "fixture-client",
      setup(build) {
        build.onResolve({ filter: /^\.\/client$/ }, (args) =>
          args.importer.includes("features\\library") ||
          args.importer.includes("features/library")
            ? { path: path.resolve(".tools/library-ui-client.ts") }
            : undefined,
        );
      },
    },
  ],
});
const preview = fs.readFileSync(".tools/library-ui-preview-path.txt", "utf8");
createServer((req, res) => {
  if (req.url === "/bundle.js") {
    res.setHeader("Content-Type", "application/javascript");
    fs.createReadStream(".tools/library-ui-bundle.js").pipe(res);
  } else if (req.url === "/original.pdf" && previewRow) {
    res.setHeader("Content-Type", "application/pdf");
    fs.createReadStream(state.privateFiles[previewRow.id].sourcePath).pipe(res);
  } else if (req.url === "/preview.webp") {
    res.setHeader("Content-Type", "image/webp");
    fs.createReadStream(preview).pipe(res);
  } else {
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,#root{height:100%;margin:0}body{font-family:system-ui}#root{display:flex;flex-direction:column}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>',
    );
  }
}).listen(8890, "127.0.0.1", () =>
  console.log(
    "Local-only admin component verification: http://127.0.0.1:8890 (actual provided metadata; writes mocked, real library unchanged)",
  ),
);
