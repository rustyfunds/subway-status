#!/usr/bin/env node
// Fetches MTA service alerts and train times (via subway-core.js) and rewrites the
// data block inside subway-status.html (between the ===SUBWAY-SYNC-=== markers).
// That snapshot is what copies of the page without live access show (the claude.ai artifact);
// a copy opened in a normal browser refreshes itself from the MTA every minute.
// Also writes index.html: the same page as a complete standalone document, for hosting
// anywhere outside claude.ai (it needs subway-core.js next to it).
//
// Usage: node sync-subway.js

const fs = require("fs");
const path = require("path");
const { loadData, STATION_BY_ID, DEFAULT_STATION_IDS } = require("./subway-core.js");

const HTML_PATH = path.join(__dirname, "subway-status.html");
const STANDALONE_PATH = path.join(__dirname, "index.html");
const START = "<!-- ===SUBWAY-SYNC-START=== -->";
const END = "<!-- ===SUBWAY-SYNC-END=== -->";

async function main() {
  // Train times are saved for the default stations only; alerts cover every line.
  const stops = DEFAULT_STATION_IDS.flatMap((id) => STATION_BY_ID.get(id).stops);
  const data = await loadData(fetch, {}, stops);
  for (const f of data.failed) console.warn(`Could not load ${f.source}: ${f.error}`);
  if (!data.alertsAt) throw new Error("MTA service alerts could not be loaded; page left unchanged");

  const { ok, ...snapshot } = data;
  const json = JSON.stringify(snapshot).replace(/</g, "\\u003c");

  const html = fs.readFileSync(HTML_PATH, "utf8");
  const i = html.indexOf(START);
  const j = html.indexOf(END);
  if (i < 0 || j < i) throw new Error(`Sync markers not found in ${HTML_PATH}`);
  const block = `${START}\n<script id="subway-data" type="application/json">${json}</script>\n`;
  const page = html.slice(0, i) + block + html.slice(j);
  fs.writeFileSync(HTML_PATH, page);

  // claude.ai wraps the page in its own document; elsewhere it needs a real head.
  const headEnd = page.indexOf("</style>") + "</style>".length;
  fs.writeFileSync(
    STANDALONE_PATH,
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      `${page.slice(0, headEnd)}\n</head>\n<body>${page.slice(headEnd)}</body>\n</html>\n`
  );

  const trains = Object.values(data.arrivals).flatMap((byDir) => Object.values(byDir)).flat().length;
  const when = new Date(data.fetchedAt * 1000).toLocaleString("en-US", { timeZone: "America/New_York" });
  console.log(`Fetched ${when}: ${data.alerts.length} alerts, ${trains} upcoming trains, ${Math.round(json.length / 1024)} KB`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
