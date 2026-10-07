import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("public ODbL country snapshot matches the app data", () => {
  const appData = readFileSync(resolve(repositoryRoot, "src/data/worldCountries.json"), "utf8");
  const publicData = readFileSync(resolve(repositoryRoot, "public/licenses/world-countries.json"), "utf8");

  assert.equal(publicData, appData);
});
test("Google Sans button font has a published OFL record", () => {
  const records = JSON.parse(readFileSync(resolve(repositoryRoot, "src/data/assetProvenance.json"), "utf8"));
  const googleSans = records.filter((record: { id: string }) => record.id === "google-sans-font");
  const publicLicense = readFileSync(resolve(repositoryRoot, "public/licenses/google-sans-OFL.txt"), "utf8");
  const packageLicense = readFileSync(resolve(repositoryRoot, "node_modules/@fontsource/google-sans/LICENSE"), "utf8");

  assert.equal(googleSans.length, 1);
  assert.equal(googleSans[0].license, "SIL Open Font License 1.1");
  assert.equal(googleSans[0].sourceLicenseLabel, "Bundled @fontsource/google-sans 5.3.1 LICENSE file");
  assert.equal(googleSans[0].creator, "Google, Inc. (2017)");
  assert.equal(googleSans[0].commercialUse, "PERMITTED");
  assert.equal(googleSans[0].modifications, "CONDITIONAL");
  assert.equal(googleSans[0].status, "VERIFIED");
  assert.equal(publicLicense, packageLicense);
});

test("Lake Baikal photo has an explicit license and complete credit", () => {
  const records = JSON.parse(readFileSync(resolve(repositoryRoot, "src/data/assetProvenance.json"), "utf8"));
  const baikalRecords = records.filter((record: { usedIn: string[] }) =>
    record.usedIn.includes("Peaks & Valleys (entry: lake_baikal_depth)"),
  );

  assert.equal(baikalRecords.length, 1);
  const [baikal] = baikalRecords;
  assert.equal(baikal.asset, "Lake Baikal, Russia.jpg");
  assert.equal(baikal.sourceUrl, "https://commons.wikimedia.org/wiki/File:Lake_Baikal%2C_Russia.jpg");
  assert.equal(baikal.license, "CC BY 4.0");
  assert.equal(baikal.licenseUrl, "https://creativecommons.org/licenses/by/4.0/");
  assert.equal(baikal.creator, "Vyacheslav Argenberg");
  assert.equal(baikal.attributionRequired, true);
  assert.equal(baikal.commercialUse, "PERMITTED");
  assert.equal(baikal.modifications, "CONDITIONAL");
  assert.match(baikal.attribution, /CSS grayscale\/contrast filter/);
  assert.equal(baikal.status, "CONDITIONAL");
});
