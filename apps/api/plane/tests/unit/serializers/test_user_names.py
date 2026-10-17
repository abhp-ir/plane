# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.serializers import UserSerializer


@pytest.mark.unit
@pytest.mark.parametrize("field", ["first_name", "last_name"])
@pytest.mark.parametrize(
    "name",
    [
        "احمدی‌نژاد",
        "سارا احمدی‌نژاد",
        "محمد‌رضا",
        "سَارا",
        "John Smith",
        "Jean-Paul",
        "O'Brien",
        "O’Brien",
        "Jose\u0301",
        "李明",
        "علی",
        "A",
        "a" * 50,
        "a" * 255,
        "",
    ],
)
def test_person_name_accepts_international_names(field, name):
    serializer = UserSerializer(data={field: name}, partial=True)
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data[field] == name


@pytest.mark.unit
@pytest.mark.parametrize("field", ["first_name", "last_name"])
@pytest.mark.parametrize(
    "name",
    [
        "a" * 256,
        "<script>alert(1)</script>",
        "{name}",
        "https://example.com",
        "www.example.com",
        "name@example.test",
        "John\nSmith",
        "John\tSmith",
        "John\rSmith",
        "John\u0000Smith",
        "John\u007fSmith",
        "John\u200bSmith",
        "John\u200dSmith",
        "John\u202eSmith",
        "John\u2066Smith",
        "‌علی",
        "علی‌",
        "علی‌‌رضا",
        "علی‌ رضا",
        "علی ‌رضا",
        "---",
    ],
)
def test_person_name_rejects_unsafe_input(field, name):
    serializer = UserSerializer(data={field: name}, partial=True)
    assert not serializer.is_valid()
    assert field in serializer.errors


@pytest.mark.contract
@pytest.mark.django_db
def test_profile_name_patch_preserves_joiner_and_rejects_unsafe_changes(session_client, create_user):
    response = session_client.patch("/api/users/me/", {"first_name": "سارا", "last_name": "احمدی‌نژاد"}, format="json")
    assert response.status_code == 200
    create_user.refresh_from_db()
    assert create_user.last_name == "احمدی‌نژاد"
    assert session_client.get("/api/users/me/").json()["last_name"] == "احمدی‌نژاد"
    for name in ["<script>", "علی\u202e", "‌علی", "a" * 256]:
        response = session_client.patch("/api/users/me/", {"last_name": name}, format="json")
        assert response.status_code == 400
        create_user.refresh_from_db()
        assert create_user.last_name == "احمدی‌نژاد"
