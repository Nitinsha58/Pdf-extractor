import { useEffect, useState } from "react";
import { API_BASE, buildMediaUrl } from "./utils";
import ToggleGroup from "./ToggleGroup";

export default function CroppedImageCard({
	item,
	options,
	onSaved,
	onDeleted,
	label,
	extraImages = [],
}) {
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
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
	const extras = Array.isArray(extraImages) ? extraImages : [];

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

	const handleDelete = async () => {
		if (deleting) return;
		setDeleting(true);
		setError("");
		try {
			const resp = await fetch(
				`${API_BASE}/api/cropped-images/${item.id}/`,
				{
					method: "DELETE",
				}
			);
			if (!resp.ok) {
				const text = await resp.text();
				throw new Error(text || `HTTP ${resp.status}`);
			}
			onDeleted?.(item.id);
		} catch (e) {
			setError(e?.message || "Failed to delete");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="bg-white border border-gray-200 overflow-hidden">
			<div className="group">
				<div className="flex flex-col divide-y divide-gray-200">
					<div className="relative bg-white overflow-hidden">
						{label ? (
							<div className="absolute top-2 right-2 z-10">
								<div className="px-2 py-1 text-xs font-semibold rounded bg-gray-900 text-white shadow">
									{label}
								</div>
							</div>
						) : null}
						{imageUrl ? (
							<img
								src={imageUrl}
								alt={`Crop ${label ? label : item.id}`}
								className="block w-full h-auto object-contain"
								loading="lazy"
							/>
						) : (
							<div className="text-sm text-gray-500 p-3">
								No image
							</div>
						)}

						<button
							type="button"
							onClick={handleDelete}
							disabled={deleting}
							aria-label={`Delete image ${item.id}`}
							className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded px-2 py-2 text-gray-700 hover:text-red-700 disabled:opacity-60">
							<svg
								viewBox="0 0 24 24"
								width="16"
								height="16"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round">
								<path d="M3 6h18" />
								<path d="M8 6V4h8v2" />
								<path d="M6 6l1 16h10l1-16" />
								<path d="M10 11v6" />
								<path d="M14 11v6" />
							</svg>
						</button>
					</div>

					{extras.map((ex, exIdx) => {
						const url = buildMediaUrl(ex?.image);
						if (!url) return null;
						const badge = label
							? `${label}.${exIdx + 1}`
							: `${item.id}.${exIdx + 1}`;
						return (
							<div
								key={`extra-${item.id}-${ex?.id ?? exIdx}`}
								className="relative bg-white overflow-hidden">
								<div className="absolute top-2 right-2 z-10">
									<div className="px-2 py-1 text-xs font-semibold rounded bg-gray-900 text-white shadow">
										{badge}
									</div>
								</div>
								<img
									src={url}
									alt={`Crop ${badge}`}
									className="block w-full h-auto object-contain"
									loading="lazy"
								/>
							</div>
						);
					})}
				</div>
			</div>

			<div className="p-3 space-y-2">
				<div className="flex items-center justify-between gap-3">
					<div className="text-xs font-semibold text-gray-800">
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

				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

					<div className="hidden md:block" />
					<div className="hidden md:block" />
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
					<div className="md:col-span-2">
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
										className={`px-2 py-1 rounded border text-xs ${
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

					<div className="md:col-span-2 grid grid-cols-2 gap-3 md:pt-5">
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
						<div className="col-span-2 flex items-center gap-2">
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
		</div>
	);
}
