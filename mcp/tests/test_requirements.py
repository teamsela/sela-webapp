import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tools.requirements import (  # noqa: E402
    _parse_page_spec,
    _requirements_doc_issues,
    _requirements_prompt_text,
)


VALID_REQUIREMENTS = """
# Feature requirements

## Source traceability matrix
| ID | Classification | Source | Evidence | Requirement |
| --- | --- | --- | --- | --- |
| R1 | [EXPLICIT] | p29 | "Shared sounds" | Compare passage sounds. |

## Confirmed functional requirements
1. [EXPLICIT] Compare passage sounds (p29).

## Acceptance criteria
- AC1 / R1: a worked example produces the cited shared sounds.

## Source conflicts and undefined labels
None identified after cross-referencing the relevant pages.

## Open questions and assumptions
None.
"""


class RequirementsWorkflowTests(unittest.TestCase):
    def test_page_specs_are_normalized_and_bounded(self):
        self.assertEqual(_parse_page_spec("5-3,1,99", 5), ([0, 2, 3, 4], ""))

    def test_traceable_document_passes_validation(self):
        self.assertEqual(_requirements_doc_issues(VALID_REQUIREMENTS), [])

    def test_untraceable_document_is_rejected(self):
        issues = _requirements_doc_issues(
            "## Functional requirements\n1. Add similar conjugations."
        )
        self.assertIn("missing source traceability section", issues)
        self.assertIn("missing acceptance criteria section", issues)
        self.assertIn("no [EXPLICIT] source classification", issues)
        self.assertIn("no page-level source citations", issues)

    def test_prompt_forbids_invented_label_semantics(self):
        prompt = _requirements_prompt_text("deck.pdf", "Wordplay")
        self.assertIn("Never invent an algorithm for a UX label", prompt)
        self.assertIn("[UNDEFINED]", prompt)
        self.assertIn("[CONFLICT]", prompt)
        self.assertIn("validate_requirements_doc", prompt)


if __name__ == "__main__":
    unittest.main()
