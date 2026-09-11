export type SignupFieldErrors = Record<string, string>;

export type SignupLeague = '' | "Men's" | "Women's";

export type SignupCompletionInput = {
  name: string;
  phone: string;
  skillLevel: number | null;
  league: SignupLeague;
  preferredCourts: string[];
};

/** One name rule, used on signup, the live hint, and profile edits. */
export const NAME_RULE = 'Name must be 3–80 characters, with no numbers.';

/** Password rules used before the Auth account is created. */
export const PASSWORD_RULE = 'Use 6 to 80 characters. Avoid a simple run like 123456 or abcdef.';

export const SKILL_RULE = 'Choose your skill level.';
export const LEAGUE_RULE = "Choose Men's or Women's.";
export const COURTS_RULE = 'Choose at least one preferred court.';

export const validatePassword = (password: string, confirmPassword: string): SignupFieldErrors => {
  const errors: SignupFieldErrors = {};
  const sequential = '1234567890abcdefghijklmnopqrstuvwxyz';
  if (
    password.length < 6 ||
    password.length > 80 ||
    password.trim().length < 3 ||
    sequential.includes(password.toLowerCase())
  ) {
    errors.password = PASSWORD_RULE;
  }
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
  return errors;
};

/**
 * Completion-step validation. Phone is optional (ten digits when supplied). League, preferred
 * courts, and skill are required; skill must be an explicit choice so unanswered is not stored as 2.0.
 */
export const validateCompletion = ({
  name,
  phone,
  skillLevel,
  league,
  preferredCourts,
}: SignupCompletionInput): SignupFieldErrors => {
  const errors: SignupFieldErrors = {};
  if (name.trim().length < 3 || name.length > 80 || /\d/.test(name)) errors.name = NAME_RULE;
  const rawPhone = phone.replace(/\D/g, '');
  if (rawPhone.length > 0 && rawPhone.length !== 10) errors.phone = 'Phone number must be exactly 10 digits';
  if (skillLevel == null) errors.skillLevel = SKILL_RULE;
  if (league !== "Men's" && league !== "Women's") errors.league = LEAGUE_RULE;
  if (preferredCourts.length === 0) errors.preferredCourts = COURTS_RULE;
  return errors;
};

export const isNameValid = (name: string) => name.trim().length >= 3 && name.length <= 80 && !/\d/.test(name);
