# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.serializers import UserSerializer


VALID_NAMES = [
    "محمدامین",
    "محمدامین اسکندری",
    "علی‌رضا",
    "علی Reza-123",
    "john.doe-123",
    "سارا_۱۲۳",
    "سَارا",
    "Jose\u0301",
    "李明.dev",
    " علی ",
    "a" * 50,
    "a" * 255,
]
INVALID_NAMES = [
    "a" * 256,
    " ",
    "<script>alert(1)</script>",
    "O'Brien",
    "name@example.test",
    "name\n",
    "\nname",
    "name\t",
    "\tname",
    "name\r",
    "name\u0000",
    "name\u007f",
    "name\u200b",
    "name\u200d",
    "name\u202e",
    "name\u2066",
    "‌علی",
    "علی‌",
    "علی‌‌رضا",
    "علی‌ رضا",
    "علی ‌رضا",
]


@pytest.mark.unit
@pytest.mark.parametrize("name", VALID_NAMES)
def test_display_name_accepts_human_names_and_handles_unchanged(name):
    serializer = UserSerializer(data={"display_name": name}, partial=True)
    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["display_name"] == name


@pytest.mark.unit
@pytest.mark.parametrize("name", INVALID_NAMES)
def test_display_name_rejects_unsafe_input_and_preserves_api_length_limit(name):
    serializer = UserSerializer(data={"display_name": name}, partial=True)
    assert not serializer.is_valid()
    assert "display_name" in serializer.errors


@pytest.mark.contract
@pytest.mark.django_db
def test_display_name_patch_round_trips_without_changing_login_identity(session_client, create_user):
    identity = (create_user.username, create_user.email)
    for name in VALID_NAMES:
        response = session_client.patch("/api/users/me/", {"display_name": name}, format="json")
        assert response.status_code == 200, response.data
        create_user.refresh_from_db()
        assert create_user.display_name == name
        assert session_client.get("/api/users/me/").json()["display_name"] == name
        assert (create_user.username, create_user.email) == identity
    retained_name = create_user.display_name
    for name in INVALID_NAMES:
        response = session_client.patch("/api/users/me/", {"display_name": name}, format="json")
        assert response.status_code == 400
        create_user.refresh_from_db()
        assert create_user.display_name == retained_name
        assert (create_user.username, create_user.email) == identity
    response = session_client.patch(
        "/api/users/me/", {"username": "must-not-change", "display_name": "محمدامین"}, format="json"
    )
    assert response.status_code == 200
    create_user.refresh_from_db()
    assert (create_user.username, create_user.email) == identity
