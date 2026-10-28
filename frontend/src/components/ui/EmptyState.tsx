import React from 'react';
import { Button, ButtonProps } from '@/components/ui/Button';
import { Link } from 'react-router-dom';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ButtonProps['variant'];
  icon?: React.ReactNode;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-border bg-card/50 transition-colors ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action &&
            (action.href ? (
              <Link to={action.href}>
                <Button variant={action.variant || 'primary'} size="sm" className="gap-2">
                  {action.icon}
                  <span>{action.label}</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant={action.variant || 'primary'}
                size="sm"
                onClick={action.onClick}
                className="gap-2"
              >
                {action.icon}
                <span>{action.label}</span>
              </Button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link to={secondaryAction.href}>
                <Button variant={secondaryAction.variant || 'outline'} size="sm" className="gap-2">
                  {secondaryAction.icon}
                  <span>{secondaryAction.label}</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant={secondaryAction.variant || 'outline'}
                size="sm"
                onClick={secondaryAction.onClick}
                className="gap-2"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </Button>
            ))}
        </div>
      )}
    </div>
  );
};
