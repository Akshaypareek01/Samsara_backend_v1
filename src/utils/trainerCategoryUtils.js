/**
 * Normalize trainer category input to a deduplicated string array.
 *
 * @param {unknown} value - Single category string or array from API/client.
 * @returns {string[]} Non-empty trimmed category values.
 */
export const normalizeTrainerCategories = (value) => {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map((c) => String(c).trim()).filter(Boolean))];
  }
  const legacy = String(value).trim();
  return legacy ? [legacy] : [];
};

/**
 * Whether a trainer belongs to a given category (supports legacy string storage).
 *
 * @param {{ category?: unknown }|null|undefined} trainer - Trainer document or lean object.
 * @param {string} category - Category enum value to check.
 * @returns {boolean}
 */
export const trainerHasCategory = (trainer, category) => {
  if (!trainer || !category) return false;
  return normalizeTrainerCategories(trainer.category).includes(category);
};
