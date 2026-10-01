import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parse } from "@babel/parser";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });

function findTopLevelVariable(name) {
  return ast.program.body.find((node) =>
    node.type === "VariableDeclaration"
    && node.declarations.some((declaration) =>
      declaration.id.type === "ObjectPattern"
      && declaration.id.properties.some((property) =>
        property.type === "ObjectProperty"
        && property.value.type === "Identifier"
        && property.value.name === name,
      ),
    ),
  );
}

test("vendor profile components cross the legacy IIFE boundary through explicit top-level aliases", () => {
  assert.ok(findTopLevelVariable("ScopedVendorProfile"), "ScopedVendorProfile must be bound at Program scope");
  assert.ok(findTopLevelVariable("ScopedVendorReviews"), "ScopedVendorReviews must be bound at Program scope");
  assert.match(source, /return \{ ProjectsScreenRoute, SavedProjectsScreenRoute, VendorProfile, VendorReviews \};/);
  assert.match(source, /<ScopedVendorProfile\s+vendor=\{vendor\}/);
  assert.match(source, /<ScopedVendorReviews\s+vendorId=\{vendor\.id\}/);
});
