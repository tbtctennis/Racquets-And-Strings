import React from 'react';
import { cn } from '../lib/cn';
import { formatPersonName } from '../utils/nameFormatting';

export type PersonInlineProps = {
  /** The stored name to display. Empty names use the same fallback as PersonRow. */
  name: string;
  className?: string;
};

/** A formatted person reference for use inside prose; it adds no layout of its own. */
export const PersonInline: React.FC<PersonInlineProps> = ({ name, className }) => (
  <span className={cn('font-semibold text-fg', className)}>{formatPersonName(name)}</span>
);
