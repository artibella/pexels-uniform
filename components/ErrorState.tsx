import { Button, Callout } from "@uniformdev/design-system";

interface ErrorStateProps {
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

export const ErrorState = ({
  title,
  description,
  buttonLabel,
  onButtonClick,
}: ErrorStateProps) => (
  <Callout title={title} type="error">
    <p className="text-gray-600 mb-4">{description}</p>
    {buttonLabel && onButtonClick && (
      <Button onClick={onButtonClick}>{buttonLabel}</Button>
    )}
  </Callout>
);
