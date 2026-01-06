import { useEffect, useState } from "react";
import { API_BASE, buildMediaUrl } from "./utils";
import ToggleGroup from "./ToggleGroup";

export default function CroppedImageCard({ item, options, onSaved }) {
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const [form, setForm] = useState(() => {
		const usageTypeIds = Array.isArray(item.usage_types)
			? item.usage_types.map((u) => u.id)
			: [];
		return {
			image_type: item.image_type ?? "",
			class_name: item.class_name ?? "",
			subject: item.subject ?? "",
			chapter: item.chapter ?? "",
			concept: item.concept ?? "",
			topic: item.topic ?? "",
			question_type: item.question_type ?? "",
			difficulty: item.difficulty ?? "",
			marks: item.marks ?? "",
			usage_types: usageTypeIds,
			priority: item.priority ?? "",
			verified: Boolean(item.verified),
			source: item.source ?? "",
			is_active: Boolean(item.is_active),
		};
	});

	useEffect(() => {
		const usageTypeIds = Array.isArray(item.usage_types)
			? item.usage_types.map((u) => u.id)
			: [];
		setForm({
			image_type: item.image_type ?? "",
			class_name: item.class_name ?? "",
			subject: item.subject ?? "",
			chapter: item.chapter ?? "",
			concept: item.concept ?? "",
			topic: item.topic ?? "",
			question_type: item.question_type ?? "",
			difficulty: item.difficulty ?? "",
			marks: item.marks ?? "",
			usage_types: usageTypeIds,
			priority: item.priority ?? "",
			verified: Boolean(item.verified),
			source: item.source ?? "",
			is_active: Boolean(item.is_active),
		});
		setError("");
	}, [item]);

	const imageUrl = buildMediaUrl(item.image);

	const toggleUsageType = (id) => {
		setForm((prev) => {
			const has = prev.usage_types.includes(id);
			return {
				...prev,
				usage_types: has
					? prev.usage_types.filter((x) => x !== id)
					: [...prev.usage_types, id],
			};
		});
	};

	const handleSave = async () => {
		setSaving(true);
		setError("");
		try {
			const payload = {
				usage_types: form.usage_types,
				verified: Boolean(form.verified),
				is_active: Boolean(form.is_active),
			};

			// Required FKs: only send if set.
			if (form.image_type !== "")
				payload.image_type = Number(form.image_type);
			if (form.class_name !== "")
				payload.class_name = Number(form.class_name);
			if (form.subject !== "") payload.subject = Number(form.subject);
			if (form.chapter !== "") payload.chapter = Number(form.chapter);

			// Nullable FKs: allow clearing via empty string.
			payload.concept = form.concept === "" ? null : Number(form.concept);
			payload.topic = form.topic === "" ? null : Number(form.topic);
			payload.question_type =
				form.question_type === "" ? null : Number(form.question_type);
			payload.source = form.source === "" ? null : Number(form.source);

			// Scalars
			if (form.difficulty) payload.difficulty = form.difficulty;
			if (form.marks !== "") payload.marks = Number(form.marks);
			payload.priority =
				form.priority === "" ? null : Number(form.priority);

			const resp = await fetch(
				`${API_BASE}/api/cropped-images/${item.id}/`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);
			if (!resp.ok) {
				const text = await resp.text();
				throw new Error(text || `HTTP ${resp.status}`);
			}
			const updated = await resp.json();
			onSaved(updated);
		} catch (e) {
			setError(e?.message || "Failed to save");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
			<div className="bg-gray-50 flex items-center justify-center overflow-hidden">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={`Crop ${item.id}`}
						className="w-full h-full object-contain"
						loading="lazy"
					/>
				) : (
					<div className="text-sm text-gray-500">No image</div>
				)}
			</div>

			<div className="p-4 space-y-3">
				<div className="flex items-center justify-between">
					<div className="text-sm font-semibold text-gray-800">
						ID: {item.id}
					</div>
					<button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="px-3 py-1 rounded bg-gray-900 text-white text-sm disabled:opacity-60">
						{saving ? "Saving…" : "Save"}
					</button>
				</div>

				{error ? (
					<div className="text-sm text-red-600 whitespace-pre-wrap">
						{error}
					</div>
				) : null}

				<div className="grid grid-cols-2 gap-3">
					<ToggleGroup
						label="Image Type"
						value={String(form.image_type)}
						clearLabel="—"
						options={options.imageTypes.map((t) => ({
							value: t.id,
							label: t.name,
						}))}
						onChange={(v) =>
							setForm((p) => ({ ...p, image_type: v }))
						}
					/>

					<ToggleGroup
						label="Question Type"
						value={String(form.question_type)}
						clearLabel="—"
						options={options.questionTypes.map((t) => ({
							value: t.id,
							label: t.name,
						}))}
						onChange={(v) =>
							setForm((p) => ({ ...p, question_type: v }))
						}
					/>

					<ToggleGroup
						label="Difficulty"
						value={form.difficulty || ""}
						clearLabel="—"
						options={[
							{ value: "easy", label: "Easy" },
							{ value: "medium", label: "Medium" },
							{ value: "hard", label: "Hard" },
						]}
						onChange={(v) =>
							setForm((p) => ({ ...p, difficulty: v }))
						}
					/>

					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							Marks
						</label>
						<input
							type="number"
							value={form.marks}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									marks: e.target.value,
								}))
							}
							className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
							min={0}
						/>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							Class
						</label>
						<select
							value={String(form.class_name)}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									class_name: e.target.value,
								}))
							}
							className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
							<option value="">—</option>
							{options.classes.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							Subject
						</label>
						<select
							value={String(form.subject)}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									subject: e.target.value,
								}))
							}
							className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
							<option value="">—</option>
							{options.subjects.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							Chapter
						</label>
						<select
							value={String(form.chapter)}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									chapter: e.target.value,
								}))
							}
							className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
							<option value="">—</option>
							{options.chapters.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							Concept
						</label>
						<select
							value={String(form.concept)}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									concept: e.target.value,
								}))
							}
							className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
							<option value="">—</option>
							{options.concepts.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-xs font-medium text-gray-600 mb-1">
							Topic
						</label>
						<select
							value={String(form.topic)}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									topic: e.target.value,
								}))
							}
							className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
							<option value="">—</option>
							{options.topics.map((t) => (
								<option key={t.id} value={t.id}>
									{t.name}
								</option>
							))}
						</select>
					</div>

					<ToggleGroup
						label="Source"
						value={String(form.source)}
						clearLabel="—"
						options={options.sources.map((t) => ({
							value: t.id,
							label: t.name,
						}))}
						onChange={(v) => setForm((p) => ({ ...p, source: v }))}
					/>
				</div>

				<div>
					<div className="text-xs font-medium text-gray-600 mb-2">
						Usage
					</div>
					<div className="flex flex-wrap gap-2">
						{options.usageTypes.map((u) => {
							const checked = form.usage_types.includes(u.id);
							return (
								<button
									key={u.id}
									type="button"
									onClick={() => toggleUsageType(u.id)}
									className={`px-3 py-1 rounded border text-sm ${
										checked
											? "bg-gray-900 text-white border-gray-900"
											: "bg-white text-gray-800 border-gray-200"
									}`}>
									{u.name}
								</button>
							);
						})}
					</div>
				</div>

				<div className="flex items-center gap-4">
					<label className="flex items-center gap-2 text-sm text-gray-700">
						<input
							type="checkbox"
							checked={form.verified}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									verified: e.target.checked,
								}))
							}
						/>
						Verified
					</label>
					<label className="flex items-center gap-2 text-sm text-gray-700">
						<input
							type="checkbox"
							checked={form.is_active}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									is_active: e.target.checked,
								}))
							}
						/>
						Active
					</label>
					<div className="flex items-center gap-2">
						<label className="text-xs font-medium text-gray-600">
							Priority
						</label>
						<input
							type="number"
							value={form.priority}
							onChange={(e) =>
								setForm((p) => ({
									...p,
									priority: e.target.value,
								}))
							}
							className="w-24 border border-gray-200 rounded px-2 py-1 text-sm"
							min={0}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
