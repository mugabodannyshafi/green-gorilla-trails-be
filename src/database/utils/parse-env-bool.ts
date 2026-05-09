/**
 * process.env / ConfigService values are strings. `"false"` is truthy in JS — never pass it raw to TypeORM `synchronize`.
 */
export function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  const v = String(value).trim().toLowerCase();
  if (['false', '0', 'no', 'off'].includes(v)) return false;
  if (['true', '1', 'yes', 'on'].includes(v)) return true;
  return defaultValue;
}
