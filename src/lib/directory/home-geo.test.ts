import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { excludeDemo } from "./exclude-demo.ts";
import { countryToRegion, decodeCity, parseVercelGeo } from "./home-geo.ts";

describe("excludeDemo", () => {
  it("filters demo slugs and does not reference a missing is_demo column", () => {
    const calls: string[][] = [];
    const query = {
      not(column: string, operator: string, value: string) {
        calls.push([column, operator, value]);
        return this;
      },
    };
    const result = excludeDemo(query);
    assert.equal(result, query);
    assert.deepEqual(calls, [["slug", "ilike", "%-demo%"]]);
  });
});

describe("homepage geo headers", () => {
  it("decodes a URI-encoded city", () => {
    assert.equal(decodeCity("S%C3%A3o%20Paulo"), "São Paulo");
  });

  it("maps GB to UK and leaves an unknown country unmapped", () => {
    assert.equal(countryToRegion("GB"), "UK");
    assert.equal(countryToRegion("gb"), "UK");
    assert.equal(countryToRegion("DE"), "EU");
    assert.equal(countryToRegion("JP"), null);
  });

  it("reads Vercel geo headers", () => {
    const headers = new Map<string, string>([
      ["x-vercel-ip-latitude", "34.85"],
      ["x-vercel-ip-longitude", "-82.39"],
      ["x-vercel-ip-city", "Greenville"],
      ["x-vercel-ip-country-region", "SC"],
      ["x-vercel-ip-country", "US"],
    ]);
    const geo = parseVercelGeo({ get: (name) => headers.get(name) || null });
    assert.equal(geo.city, "Greenville");
    assert.equal(geo.regionCode, "US");
    assert.equal(geo.lat, 34.85);
    assert.equal(geo.lng, -82.39);
  });
});
