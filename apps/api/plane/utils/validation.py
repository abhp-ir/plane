# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unicodedata import category


def is_valid_person_name(value: str) -> bool:
    """Allow name characters and interior ZWNJ without accepting other controls."""
    if not value:
        return True  # API name fields remain optional; their serializer owns length.
    for index, char in enumerate(value):
        if char == "\u200c":
            if (
                index == 0
                or index == len(value) - 1
                or category(value[index - 1])[0] not in "LM"
                or not value[index + 1].isalpha()
            ):
                return False
        elif category(char)[0] not in "LM" and char not in " '-’":
            return False
    return any(char.isalpha() for char in value)
