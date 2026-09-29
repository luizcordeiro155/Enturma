const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");
const config = getDefaultConfig(__dirname);
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.join(__dirname, "node_modules"),
  path.join(__dirname, "../../node_modules"),
];
module.exports = config;
