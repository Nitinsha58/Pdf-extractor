export const API_BASE = "http://localhost:8000";

export function buildMediaUrl(imageValue) {
	if (!imageValue) return "";
	if (typeof imageValue !== "string") return "";
	if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) {
		return imageValue;
	}
	if (imageValue.startsWith("/media/")) {
		return `${API_BASE}${imageValue}`;
	}
	if (imageValue.startsWith("media/")) {
		return `${API_BASE}/${imageValue}`;
	}
	// Django ImageField often returns "cropped/xyz.png".
	return `${API_BASE}/media/${imageValue}`;
}
