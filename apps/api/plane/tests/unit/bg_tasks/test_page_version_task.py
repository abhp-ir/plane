# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from datetime import timedelta

import pytest
from django.utils import timezone

from plane.bgtasks.page_version_task import track_page_version
from plane.db.models import Page, PageVersion


@pytest.mark.unit
@pytest.mark.django_db
@pytest.mark.parametrize("recent", [False, True])
def test_page_version_preserves_all_content_formats(workspace, create_user, recent):
    page = Page.objects.create(
        workspace=workspace,
        owned_by=create_user,
        name="صفحهٔ آزمایشی",
        description_json={"type": "doc", "content": [{"type": "paragraph"}]},
        description_html="<p>فارسی می‌رود ABC-42</p>",
        description_binary=b"canonical-binary",
    )
    previous = None
    if recent:
        previous = PageVersion.objects.create(
            workspace=workspace, page=page, owned_by=create_user,
            description_html="<p>before</p>", last_saved_at=timezone.now(),
        )
    track_page_version(str(page.id), json.dumps({"description_html": "<p>before</p>"}), str(create_user.id))
    version = PageVersion.objects.get(page=page)
    assert version.description_json == page.description_json
    assert version.description_html == page.description_html
    assert bytes(version.description_binary) == bytes(page.description_binary)
    assert version.description_stripped == page.description_stripped
    assert version.owned_by_id == create_user.id
    if previous:
        assert version.id == previous.id
        assert version.last_saved_at == previous.last_saved_at


@pytest.mark.unit
@pytest.mark.django_db
def test_expired_version_is_preserved_and_unchanged_html_creates_no_version(workspace, create_user):
    page = Page.objects.create(workspace=workspace, owned_by=create_user, description_html="<p>after</p>")
    old = PageVersion.objects.create(
        workspace=workspace, page=page, owned_by=create_user,
        description_html="<p>before</p>", last_saved_at=timezone.now() - timedelta(seconds=601),
    )
    track_page_version(str(page.id), json.dumps({"description_html": "<p>before</p>"}), str(create_user.id))
    assert PageVersion.objects.filter(page=page).count() == 2
    old.refresh_from_db()
    assert old.description_html == "<p>before</p>"
    track_page_version(str(page.id), json.dumps({"description_html": page.description_html}), str(create_user.id))
    assert PageVersion.objects.filter(page=page).count() == 2
