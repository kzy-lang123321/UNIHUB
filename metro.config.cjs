const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  ...["artifacts", ".tools", ".library", ".npm-cache", "android", "ios", "test-results", "playwright-report"].map((name) => new RegExp(escape(path.resolve(__dirname, name)) + "[/\\\\].*")),
  new RegExp(escape(path.resolve(__dirname, "node_modules")) + "[/\\\\].*[/\\\\]android[/\\\\](?:build|\\.cxx)[/\\\\].*"),
];
module.exports = config;
