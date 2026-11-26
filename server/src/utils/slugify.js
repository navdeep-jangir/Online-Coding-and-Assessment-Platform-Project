/**
 * Converts a string into a URL-safe lowercase slug.
 *
 * @param {string} text
 * @returns {string}
 */
export const slugify = (text = '') =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default slugify;
