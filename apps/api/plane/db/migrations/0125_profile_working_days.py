# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("db", "0124_intakeissue_intake_issue_snoozed_till_idx")]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="working_days",
            field=models.JSONField(blank=True, default=None, null=True),
        ),
    ]
