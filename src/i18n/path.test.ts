import assert from "node:assert/strict";
import test from "node:test";
import { localizePath, splitLocalePrefix } from "./config.ts";

test("english paths stay unprefixed", () => {
  assert.equal(localizePath("/directory", "en"), "/directory");
  assert.equal(localizePath("/", "en"), "/");
  assert.deepEqual(splitLocalePrefix("/directory/paris"), { locale: "en", pathname: "/directory/paris" });
});

test("french paths use the /fr prefix and round-trip", () => {
  assert.equal(localizePath("/", "fr"), "/fr");
  assert.equal(localizePath("/directory", "fr"), "/fr/directory");
  assert.equal(localizePath("/directory?location=Paris&country=FR", "fr"), "/fr/directory?location=Paris&country=FR");
  assert.equal(localizePath("/chiropractor/paris-idf#map", "fr"), "/fr/chiropractor/paris-idf#map");
  assert.deepEqual(splitLocalePrefix("/fr/directory/dr-martin"), { locale: "fr", pathname: "/directory/dr-martin" });
  assert.deepEqual(splitLocalePrefix("/fr"), { locale: "fr", pathname: "/" });
});

test("french prefix is not applied twice and skips app areas", () => {
  assert.equal(localizePath("/fr/directory", "fr"), "/fr/directory");
  assert.equal(localizePath("/doctor/billing", "fr"), "/doctor/billing");
  assert.equal(localizePath("/admin/members", "fr"), "/admin/members");
  assert.equal(localizePath("https://neurochiro.co/directory", "fr"), "https://neurochiro.co/directory");
  assert.equal(localizePath("mailto:support@neurochirodirectory.com", "fr"), "mailto:support@neurochirodirectory.com");
  assert.equal(localizePath("#hero-location", "fr"), "#hero-location");
});
