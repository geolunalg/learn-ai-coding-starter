import pytest

from sloperator.errors import LexicalError
from sloperator.lexer import tokenize


@pytest.mark.parametrize("char", ["@", "$", "%", "~", "?", ":"])
def test_unexpected_character_is_a_lexical_error(char: str):
    """Regression test for the scanner's generic fallback.

    Every other ``LexicalError`` raise site had coverage in
    ``test_lexer.py``, but the catch-all at the end of
    ``Scanner.scan_token`` did not. Commit a9d9f0c fixed a typo
    ("charcter" -> "character") in this message without adding a test,
    so this pins both the error and its wording.
    """
    with pytest.raises(LexicalError) as info:
        tokenize(f"a {char} b")

    assert info.value.line == 1
    assert info.value.message == f"unexpected character '{char}'"
    assert str(info.value) == (
        f"SlopLang lexical error at line 1: unexpected character '{char}'"
    )
