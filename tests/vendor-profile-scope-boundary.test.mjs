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

function findTopLevelFunction(name) {
  return ast.program.body.find((node) =>
    node.type === "FunctionDeclaration" && node.id?.name === name,
  );
}

test("vendor profile components cross the legacy IIFE boundary through explicit top-level aliases", () => {
  assert.ok(findTopLevelVariable("ScopedVendorProfile"), "ScopedVendorProfile must be bound at Program scope");
  assert.ok(findTopLevelVariable("ScopedVendorReviews"), "ScopedVendorReviews must be bound at Program scope");
  assert.match(source, /return \{ ProjectsScreenRoute, SavedProjectsScreenRoute, VendorProfile, VendorReviews, applyProjectsScreenDependencies \};/);
  assert.match(source, /<ScopedVendorProfile\s+vendor=\{vendor\}/);
  assert.match(source, /<ScopedVendorReviews\s+vendorId=\{vendor\.id\}/);

  const proofScreen = findTopLevelFunction("VendorProofAndReviewsScreen");
  assert.ok(proofScreen, "VendorProofAndReviewsScreen must remain at Program scope");
  const initializer = proofScreen.body.body[0]?.expression;
  assert.equal(initializer?.type, "CallExpression");
  assert.equal(initializer?.callee?.name, "applyScopedProjectsDependencies");
  assert.equal(initializer?.arguments?.[0]?.callee?.name, "getProjectsScreenDependencies");
});
