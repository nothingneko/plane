import React, { useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import issuesService from "services/issues.service";
// components
import {
  ViewDueDateSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues/view-select";
// ui
import { AssigneesList } from "components/ui/avatar";
import { CustomMenu, Tooltip } from "components/ui";
// types
import { IIssue, Properties } from "types";
// fetch-keys
import { USER_ISSUE } from "constants/fetch-keys";
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import useToast from "hooks/use-toast";
import { LinkIcon } from "@heroicons/react/24/outline";

type Props = {
  issue: IIssue;
  properties: Properties;
  projectId: string;
};

export const MyIssuesListItem: React.FC<Props> = ({ issue, properties, projectId }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const { setToastAlert } = useToast();

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>) => {
      if (!workspaceSlug) return;

      mutate<IIssue[]>(
        USER_ISSUE(workspaceSlug as string),
        (prevData) =>
          prevData?.map((p) => {
            if (p.id === issue.id) return { ...p, ...formData };

            return p;
          }),
        false
      );

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issue.id, formData)
        .then((res) => {
          mutate(USER_ISSUE(workspaceSlug as string));
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, issue]
  );

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const isNotAllowed = false;

  return (
    <div className="border-b border-skin-base last:border-b-0">
      <div key={issue.id} className="flex items-center justify-between gap-2 px-4 py-3">
        <Link href={`/${workspaceSlug}/projects/${issue?.project_detail?.id}/issues/${issue.id}`}>
          <a className="group relative flex items-center gap-2">
            {properties?.key && (
              <Tooltip
                tooltipHeading="Issue ID"
                tooltipContent={`${issue.project_detail?.identifier}-${issue.sequence_id}`}
              >
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {issue.project_detail?.identifier}-{issue.sequence_id}
                </span>
              </Tooltip>
            )}
            <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
              <span className="break-all text-sm text-skin-base">
                {truncateText(issue.name, 50)}
              </span>
            </Tooltip>
          </a>
        </Link>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {properties.priority && (
            <ViewPrioritySelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.state && (
            <ViewStateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.due_date && (
            <ViewDueDateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.sub_issue_count && (
            <div className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs shadow-sm">
              {issue?.sub_issues_count} {issue?.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
            </div>
          )}
          {properties.labels && issue.label_details.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {issue.label_details.map((label) => (
                <span
                  key={label.id}
                  className="group flex items-center gap-1 rounded-2xl border px-2 py-0.5 text-xs"
                >
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: label?.color && label.color !== "" ? label.color : "#000",
                    }}
                  />
                  {label.name}
                </span>
              ))}
            </div>
          ) : (
            ""
          )}
          {properties.assignee && (
            <Tooltip
              position="top-right"
              tooltipHeading="Assignees"
              tooltipContent={
                issue.assignee_details.length > 0
                  ? issue.assignee_details
                      .map((assignee) =>
                        assignee?.first_name !== "" ? assignee?.first_name : assignee?.email
                      )
                      .join(", ")
                  : "No Assignee"
              }
            >
              <div className="flex items-center gap-1">
                <AssigneesList userIds={issue.assignees ?? []} />
              </div>
            </Tooltip>
          )}
          <CustomMenu width="auto" ellipsis>
            <CustomMenu.MenuItem onClick={handleCopyText}>
              <span className="flex items-center justify-start gap-2">
                <LinkIcon className="h-4 w-4" />
                <span>Copy issue link</span>
              </span>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </div>
  );
};
