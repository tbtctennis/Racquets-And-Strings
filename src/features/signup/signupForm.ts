export type SignupFieldErrors = Record<string, string>;

/** One name rule, used on signup, the live hint, and profile edits. */
export const NAME_RULE = 'Name must be 3–80 characters, with no numbers.';

/** Password rules used before the Auth account is created. */
export const PASSWORD_RULE = 'Use 6 to 80 characters. Avoid a simple run like 123456 or abcdef.';

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

/** Completion-step validation; a phone number is optional, but must be ten digits when supplied. */
export const validateCompletion = (name: string, phone: string): SignupFieldErrors => {
  const errors: SignupFieldErrors = {};
  if (name.trim().length < 3 || name.length > 80 || /\d/.test(name)) errors.name = NAME_RULE;
  const rawPhone = phone.replace(/\D/g, '');
  if (rawPhone.length > 0 && rawPhone.length !== 10) errors.phone = 'Phone number must be exactly 10 digits';
  return errors;
};

export const isNameValid = (name: string) => name.trim().length >= 3 && name.length <= 80 && !/\d/.test(name);
