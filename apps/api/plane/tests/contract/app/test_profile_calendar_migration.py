# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


@pytest.mark.django_db(transaction=True)
def test_working_day_migration_preserves_existing_profile_preferences_in_both_directions():
    before = ("db", "0124_intakeissue_intake_issue_snoozed_till_idx")
    after = ("db", "0125_profile_working_days")

    def migrate(target):
        executor = MigrationExecutor(connection)
        executor.migrate([target])
        return executor.loader.project_state([target]).apps

    try:
        apps = migrate(before)
        User, Profile = apps.get_model("db", "User"), apps.get_model("db", "Profile")
        rows = []
        for language, week in [("fa", 0), ("fa", 6), ("en", 1)]:
            user = User.objects.create(email=f"{language}-{week}@calendar.test", username=f"calendar-{language}-{week}")
            rows.append(Profile.objects.create(user=user, language=language, start_of_the_week=week))
        snapshots = [Profile.objects.filter(pk=row.pk).values().get() for row in rows]
        Profile = migrate(after).get_model("db", "Profile")
        for snapshot in snapshots:
            result = Profile.objects.filter(pk=snapshot["id"]).values().get()
            assert result.pop("working_days") is None
            assert result == snapshot
        Profile.objects.filter(pk=rows[0].pk).update(working_days=[6, 0, 1, 2, 3])
        Profile = migrate(before).get_model("db", "Profile")
        assert [Profile.objects.filter(pk=row.pk).values().get() for row in rows] == snapshots
    finally:
        migrate(after)
