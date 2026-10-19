# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.serializers import ProfileSerializer
from plane.db.models import Profile, User

URL = "/api/users/me/profile/"


@pytest.mark.django_db
@pytest.mark.parametrize(
    "language,explicit,expected",
    [("fa", None, 6), ("en", None, 0), ("de", None, 0), ("fa", 0, 0), ("fa", 1, 1)],
)
def test_new_profile_week_default_preserves_explicit_preferences(create_user, language, explicit, expected):
    values = {"user": create_user, "language": language}
    if explicit is not None:
        values["start_of_the_week"] = explicit
    profile = Profile.objects.create(**values)
    profile.refresh_from_db()
    assert profile.start_of_the_week == expected


@pytest.mark.django_db
def test_working_days_save_reload_scope_and_language_independence(session_client, create_user):
    own = Profile.objects.create(user=create_user, language="fa", start_of_the_week=0)
    other = Profile.objects.create(
        user=User.objects.create(email="calendar-other@plane.test", username="calendar-other")
    )
    before = ProfileSerializer(own).data
    for days in [[6, 0, 1, 2, 3], [6, 0, 1, 2, 3, 4], [6, 0, 1, 2, 3]]:
        response = session_client.patch(URL, {"working_days": days, "start_of_the_week": 6}, format="json")
        assert response.status_code == 200, response.data
        own.refresh_from_db()
        assert own.working_days == days
        assert own.start_of_the_week == 6
        assert session_client.get(URL).data["working_days"] == days
    for language in ["en", "fa"]:
        response = session_client.patch(URL, {"language": language}, format="json")
        assert response.status_code == 200
        assert response.data["start_of_the_week"] == 6
        assert response.data["working_days"] == [6, 0, 1, 2, 3]
    after = ProfileSerializer(Profile.objects.get(pk=own.pk)).data
    for key in before.keys() - {"working_days", "start_of_the_week", "updated_at"}:
        assert before[key] == after[key], key
    other.refresh_from_db()
    assert other.start_of_the_week == 0
    assert other.working_days is None


@pytest.mark.django_db
def test_existing_sunday_and_null_workday_preference_survive_unrelated_save(session_client, create_user):
    profile = Profile.objects.create(user=create_user, language="en", start_of_the_week=0)
    assert session_client.patch(URL, {"language": "fa"}, format="json").status_code == 200
    profile.refresh_from_db()
    assert profile.start_of_the_week == 0
    assert profile.working_days is None


@pytest.mark.parametrize("days", [[], [0, 0], [-1], [7], [True], ["Friday"], list(range(8)), {}, 6])
def test_working_days_reject_invalid_weekday_configuration(days):
    serializer = ProfileSerializer(data={"working_days": days}, partial=True)
    assert not serializer.is_valid()
    assert "working_days" in serializer.errors


@pytest.mark.django_db
def test_profile_calendar_requires_authentication(api_client):
    assert api_client.patch(URL, {"working_days": [6], "start_of_the_week": 6}, format="json").status_code == 401
