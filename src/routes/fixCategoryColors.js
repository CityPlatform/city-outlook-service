import { getAccessToken } from "../services/graphAuth.js";
import { ensureCategoryRegistered } from "../services/graphMail.js";
import { CATEGORY_COLORS } from "../config/categoryColors.js";

// POST /fix-category-colors
// One-time utility: forces every category in CATEGORY_COLORS to match its
// configured color, regardless of whether it's been used by the classifier yet.
export async function fixCategoryColorsRoute(env) {
  try {
    const token = await getAccessToken(env);
    const results = [];

    for (const categoryName of Object.keys(CATEGORY_COLORS)) {
      const result = await ensureCategoryRegistered(token, categoryName);
      results.push({ category: categoryName, color: result.color });
    }

    return Response.json({ success: true, results });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
