import React from 'react';
import { cn } from '../lib/cn';

type ListRowProps = {
  /** Content shown before the main copy, such as an icon, avatar, or status marker. */
  leading?: React.ReactNode | undefined;
  /** The primary row content. When omitted, `children` is used as the primary content. */
  title?: React.ReactNode | undefined;
  /** Secondary copy beneath the title. It is truncated so the row stays one line tall. */
  description?: React.ReactNode | undefined;
  /** Additional compact metadata beside the title, before the trailing slot. */
  meta?: React.ReactNode | undefined;
  /** Content aligned to the far edge of the row. */
  trailing?: React.ReactNode | undefined;
  /** An action slot for controls that should not trigger the row action. */
  action?: React.ReactNode | undefined;
  children?: React.ReactNode | undefined;
  className?: string | undefined;
  /** Makes the whole row a keyboard-accessible action. */
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  /** Makes the row a native link while retaining the shared layout. */
  href?: string | undefined;
  target?: React.HTMLAttributeAnchorTarget | undefined;
  rel?: string | undefined;
  disabled?: boolean | undefined;
  'aria-label'?: string;
  'aria-current'?: React.AriaAttributes['aria-current'];
};

const rowClassName = (className?: string) =>
  cn(
    'group flex min-h-11 w-full items-center gap-3 border-b border-fg/10 px-4 py-3 text-left last:border-b-0',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay',
    className,
  );

const RowContent: React.FC<
  Pick<ListRowProps, 'leading' | 'title' | 'description' | 'meta' | 'trailing' | 'action' | 'children'>
> = ({ leading, title, description, meta, trailing, action, children }) => (
  <>
    {leading ? <span className="shrink-0">{leading}</span> : null}
    <span className="min-w-[40%] flex-1 overflow-hidden">
      {title !== undefined ? (
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-semibold text-fg">{title}</span>
          {meta ? <span className="shrink-0 text-xs text-fg/70">{meta}</span> : null}
        </span>
      ) : (
        <span className="block min-w-0 truncate whitespace-nowrap">{children}</span>
      )}
      {description !== undefined ? (
        <span className="mt-0.5 block truncate whitespace-nowrap text-xs text-fg/70">{description}</span>
      ) : null}
    </span>
    {title === undefined && meta ? <span className="shrink-0 text-xs text-fg/70">{meta}</span> : null}
    {trailing ? <span className="max-w-[35%] min-w-0 truncate text-right text-sm text-fg/70">{trailing}</span> : null}
    {action ? <span className="flex w-[78px] shrink-0 justify-end">{action}</span> : null}
  </>
);

/** Shared, mobile-safe row primitive for list surfaces. */
export const ListRow: React.FC<ListRowProps> = (props) => {
  const { href, target, rel, onClick, disabled, className, ...contentProps } = props;
  const classes = rowClassName(cn(onClick || href ? 'transition-colors hover:bg-fg/[0.03]' : undefined, className));

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        aria-label={props['aria-label']}
        aria-current={props['aria-current']}
        className={classes}
      >
        <RowContent {...contentProps} />
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={props['aria-label']}
        aria-current={props['aria-current']}
        className={cn(classes, 'disabled:cursor-not-allowed disabled:opacity-60')}
      >
        <RowContent {...contentProps} />
      </button>
    );
  }

  return (
    <div aria-label={props['aria-label']} aria-current={props['aria-current']} className={classes}>
      <RowContent {...contentProps} />
    </div>
  );
};
