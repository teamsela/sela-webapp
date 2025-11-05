import assert from "node:assert/strict";

import {
  buildMorphFeatures,
  verbConjugationLabels,
  type MorphFeatures,
} from "../../src/components/StudyPane/InfoPane/Syntax";

const getLabel = (id: string) => {
  const label = verbConjugationLabels.find((entry) => entry.id === id);
  if (!label) {
    throw new Error(`Unknown label "${id}"`);
  }
  return label;
};

const expectPredicate = (labelId: string, features: MorphFeatures | null) => {
  assert.ok(features, `Expected morph features for ${labelId}`);
  const predicate = getLabel(labelId).predicate;
  return predicate(features!);
};

const run = () => {
  const conjImperfect = buildMorphFeatures("V-Qal:ConjImperf-3mp");
  assert.ok(conjImperfect, "Should parse ConjImperf segment");
  assert.ok(
    expectPredicate("vc-imperfect", conjImperfect),
    "ConjImperf should satisfy imperfect predicate",
  );
  assert.ok(
    !expectPredicate("vc-imperative", conjImperfect),
    "ConjImperf should not satisfy imperative predicate",
  );

  const imperative = buildMorphFeatures("V-Qal:Imp-2ms");
  assert.ok(imperative, "Should parse imperative segment");
  assert.ok(expectPredicate("vc-imperative", imperative), "IMP should match imperative");
  assert.ok(
    !expectPredicate("vc-imperfect", imperative),
    "IMP should not match imperfect",
  );

  const cohortative = buildMorphFeatures("V-Piel-ConjImperfCohort-1cs");
  assert.ok(cohortative, "Should parse Cohort code");
  assert.ok(
    expectPredicate("vc-cohortative", cohortative),
    "Cohort code should match cohortative",
  );
  assert.ok(
    expectPredicate("vc-imperfect", cohortative),
    "Cohort code should still include imperfect token",
  );

  const jussive = buildMorphFeatures("V-Hifil-ImperfJus-3ms");
  assert.ok(jussive, "Should parse Jussive code");
  assert.ok(
    expectPredicate("vc-jussive", jussive),
    "Jussive code should match jussive predicate",
  );

  console.log("Syntax verb conjugation predicates: OK");
};

run();
