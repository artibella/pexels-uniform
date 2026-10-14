import React from "react";
import { Popover } from "@uniformdev/design-system";
import { REFERRAL_QUERY_PARAMS } from "../lib/constants";

interface CreditsPopoverProps {
  kind: "Photo" | "Video";
  authorName: string;
  authorUrl?: string;
}

const withReferral = (url: string) =>
  `${url}${url.includes("?") ? "&" : "?"}${REFERRAL_QUERY_PARAMS}`;

export const CreditsPopover: React.FC<CreditsPopoverProps> = ({
  kind,
  authorName,
  authorUrl,
}) => (
  <Popover
    buttonText={`${kind} credits`}
    icon="info"
    ariaLabel={`${kind} credits`}
  >
    <div className="w-fit text-sm text-gray-400">
      <span>{kind} by </span>
      {authorUrl ? (
        <a
          href={withReferral(authorUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:underline"
        >
          {authorName}
        </a>
      ) : (
        <span className="text-gray-600">{authorName}</span>
      )}
      <span> on </span>
      <a
        href={withReferral("https://www.pexels.com")}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 hover:underline"
      >
        Pexels
      </a>
    </div>
  </Popover>
);
