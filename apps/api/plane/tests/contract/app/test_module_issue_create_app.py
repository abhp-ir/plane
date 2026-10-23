# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Module membership writes must target a live module in the requested project."""

from unittest import mock
from uuid import uuid4

import pytest
from rest_framework import status

from plane.app.permissions import ROLE
from plane.db.models import Issue, Module, ModuleIssue, Project, ProjectMember, State, WorkspaceMember
from plane.tests.factories import UserFactory, WorkspaceFactory


@pytest.fixture
def setup(db, workspace, create_user):
    project = Project.objects.create(name="P", identifier="P", workspace=workspace, created_by=create_user)
    member = ProjectMember.objects.create(
        project=project, member=create_user, workspace=workspace, role=ROLE.ADMIN.value
    )
    state = State.objects.create(name="Todo", project=project, group="backlog", default=True)
    issue = Issue.objects.create(name="I", workspace=workspace, project=project, state=state, created_by=create_user)
    module = Module.objects.create(name="M", project=project, workspace=workspace)
    return project, member, issue, module


def url(workspace, project, module_id):
    return f"/api/workspaces/{workspace.slug}/projects/{project.id}/modules/{module_id}/issues/"


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.app.views.module.issue.issue_activity")
def test_create_in_live_module(activity, session_client, workspace, setup):
    project, _, issue, module = setup

    response = session_client.post(url(workspace, project, module.id), {"issues": [str(issue.id)]}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    assert ModuleIssue.objects.filter(module=module, issue=issue, project=project, workspace=workspace).exists()
    activity.delay.assert_called_once()


@pytest.mark.contract
@pytest.mark.django_db
@pytest.mark.parametrize("target", ["missing", "deleted", "other_project", "other_workspace"])
@mock.patch("plane.db.mixins.soft_delete_related_objects")
@mock.patch("plane.app.views.module.issue.issue_activity")
def test_rejects_unavailable_module(activity, deletion, target, session_client, workspace, create_user, setup):
    project, _, issue, module = setup
    module_id = module.id
    if target == "missing":
        module_id = uuid4()
    elif target == "deleted":
        module.delete()
    else:
        other_workspace = WorkspaceFactory(owner=create_user) if target == "other_workspace" else workspace
        other_project = Project.objects.create(name="Other", identifier="OTHER", workspace=other_workspace)
        module_id = Module.objects.create(name="Other", project=other_project, workspace=other_workspace).id

    response = session_client.post(url(workspace, project, module_id), {"issues": [str(issue.id)]}, format="json")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert not ModuleIssue.objects.filter(issue=issue).exists()
    activity.delay.assert_not_called()


@pytest.mark.contract
@pytest.mark.django_db
@mock.patch("plane.app.views.module.issue.issue_activity")
def test_guest_cannot_create_membership(activity, session_client, workspace, setup):
    project, _, issue, module = setup
    guest = UserFactory()
    WorkspaceMember.objects.create(workspace=workspace, member=guest, role=ROLE.GUEST.value)
    ProjectMember.objects.create(project=project, member=guest, workspace=workspace, role=ROLE.GUEST.value)
    session_client.force_authenticate(user=guest)

    response = session_client.post(url(workspace, project, module.id), {"issues": [str(issue.id)]}, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert not ModuleIssue.objects.filter(issue=issue).exists()
    activity.delay.assert_not_called()
