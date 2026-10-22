# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

import pytest
from django.utils.dateparse import parse_datetime

from plane.app.serializers import IssueAttachmentLiteSerializer
from plane.db.models import FileAsset, User


@pytest.mark.unit
def test_embedded_attachment_retains_the_upload_instant_and_read_only_metadata():
    creator = User(id=uuid4(), display_name="سارا ABC-42")
    editor = User(id=uuid4(), display_name="Editor")
    created = datetime(2025, 3, 20, 22, 0, tzinfo=timezone.utc)
    updated = datetime(2026, 4, 20, 12, 0, tzinfo=timezone.utc)
    attributes = {"name": "می‌رود ABC-42.png", "size": 68}
    asset = FileAsset(
        id=uuid4(),
        created_by=creator,
        updated_by=editor,
        created_at=created,
        updated_at=updated,
        attributes=deepcopy(attributes),
    )
    fields = ["id", "asset", "attributes", "created_by", "created_at", "updated_at", "updated_by", "asset_url"]
    serializer = IssueAttachmentLiteSerializer(asset)
    data = serializer.data

    assert set(data) == set(fields)
    assert serializer.fields["created_at"].read_only
    assert parse_datetime(data["created_at"]).astimezone(timezone.utc) == created
    assert parse_datetime(data["updated_at"]).astimezone(timezone.utc) == updated
    assert data["created_by"] == creator.id
    assert data["updated_by"] == editor.id
    assert data["attributes"] == attributes == asset.attributes
    assert asset.created_at == created and asset.updated_at == updated
