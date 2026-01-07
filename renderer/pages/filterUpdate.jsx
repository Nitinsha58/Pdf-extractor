import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "./filterUpdate/utils";
import ToggleGroup from "./filterUpdate/ToggleGroup";
import CroppedImageCard from "./filterUpdate/CroppedImageCard";
import TopNav from "../components/TopNav";
import SearchableSelect from "../components/SearchableSelect";

export default function FilterUpdatePage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [items, setItems] = useState([]);
	const [meta, setMeta] = useState({ page: 1, page_size: 24, count: 0 });

	const [options, setOptions] = useState({
		classes: [],
		subjects: [],
		chapters: [],
		concepts: [],
		topics: [],
		imageTypes: [],
		questionTypes: [],
		usageTypes: [],
		sources: [],
	});

	const [filters, setFilters] = useState({
		image_type: "",
		question_type: "",
		difficulty: "",
		marks: "",
		usage_types: [],
		source: "",
		is_active: "1",
		verified: "",
		priority: "",
		class_name: "",
		subject: "",
		chapter: "",
		concept: "",
		topic: "",
	});

	const usageTypeOptions = useMemo(
		() => options.usageTypes.map((u) => ({ value: u.id, label: u.name })),
		[options.usageTypes]
	);

	const filteredChapters = useMemo(() => {
		const classId = filters.class_name ? Number(filters.class_name) : null;
		const subjectId = filters.subject ? Number(filters.subject) : null;
		return options.chapters
			.filter((c) => {
				if (classId && c.class_name_id !== classId) return false;
				if (subjectId && c.subject_id !== subjectId) return false;
				return true;
			})
			.map((c) => ({ value: c.id, label: c.name }));
	}, [options.chapters, filters.class_name, filters.subject]);

	const filteredConcepts = useMemo(() => {
		const classId = filters.class_name ? Number(filters.class_name) : null;
		const subjectId = filters.subject ? Number(filters.subject) : null;
		const chapterId = filters.chapter ? Number(filters.chapter) : null;
		return options.concepts
			.filter((c) => {
				if (chapterId && c.chapter_id !== chapterId) return false;
				if (!chapterId) {
					if (classId && c.class_name_id !== classId) return false;
					if (subjectId && c.subject_id !== subjectId) return false;
				}
				return true;
			})
			.map((c) => ({ value: c.id, label: c.name }));
	}, [
		options.concepts,
		filters.class_name,
		filters.subject,
		filters.chapter,
	]);

	const filteredTopics = useMemo(() => {
		const classId = filters.class_name ? Number(filters.class_name) : null;
		const subjectId = filters.subject ? Number(filters.subject) : null;
		const chapterId = filters.chapter ? Number(filters.chapter) : null;
		const conceptId = filters.concept ? Number(filters.concept) : null;
		return options.topics
			.filter((t) => {
				if (conceptId && t.concept_id !== conceptId) return false;
				if (!conceptId && chapterId && t.chapter_id !== chapterId)
					return false;
				if (!conceptId && !chapterId) {
					if (classId && t.class_name_id !== classId) return false;
					if (subjectId && t.subject_id !== subjectId) return false;
				}
				return true;
			})
			.map((t) => ({ value: t.id, label: t.name }));
	}, [
		options.topics,
		filters.class_name,
		filters.subject,
		filters.chapter,
		filters.concept,
	]);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const [
					classesResp,
					subjectsResp,
					chaptersResp,
					conceptsResp,
					topicsResp,
					imageTypesResp,
					questionTypesResp,
					usageTypesResp,
					sourcesResp,
				] = await Promise.all([
					fetch(`${API_BASE}/api/classes/`),
					fetch(`${API_BASE}/api/subjects/`),
					fetch(`${API_BASE}/api/chapters/`),
					fetch(`${API_BASE}/api/concepts/`),
					fetch(`${API_BASE}/api/topics/`),
					fetch(`${API_BASE}/api/image-types/`),
					fetch(`${API_BASE}/api/question-types/`),
					fetch(`${API_BASE}/api/usage-types/`),
					fetch(`${API_BASE}/api/sources/`),
				]);

				if (cancelled) return;
				const [
					classes,
					subjects,
					chapters,
					concepts,
					topics,
					imageTypes,
					questionTypes,
					usageTypes,
					sources,
				] = await Promise.all([
					classesResp.json(),
					subjectsResp.json(),
					chaptersResp.json(),
					conceptsResp.json(),
					topicsResp.json(),
					imageTypesResp.json(),
					questionTypesResp.json(),
					usageTypesResp.json(),
					sourcesResp.json(),
				]);

				if (cancelled) return;
				setOptions({
					classes: Array.isArray(classes) ? classes : [],
					subjects: Array.isArray(subjects) ? subjects : [],
					chapters: Array.isArray(chapters) ? chapters : [],
					concepts: Array.isArray(concepts) ? concepts : [],
					topics: Array.isArray(topics) ? topics : [],
					imageTypes: Array.isArray(imageTypes) ? imageTypes : [],
					questionTypes: Array.isArray(questionTypes)
						? questionTypes
						: [],
					usageTypes: Array.isArray(usageTypes) ? usageTypes : [],
					sources: Array.isArray(sources) ? sources : [],
				});
			} catch (e) {
				if (!cancelled)
					setError(e?.message || "Failed to load options");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const buildQuery = (page, f = filters) => {
		const params = new URLSearchParams();
		params.set("page", String(page));
		params.set("page_size", String(meta.page_size));

		const entries = {
			image_type: f.image_type,
			question_type: f.question_type,
			difficulty: f.difficulty,
			marks: f.marks,
			source: f.source,
			is_active: f.is_active,
			verified: f.verified,
			priority: f.priority,
			class_name: f.class_name,
			subject: f.subject,
			chapter: f.chapter,
			concept: f.concept,
			topic: f.topic,
		};
		Object.entries(entries).forEach(([k, v]) => {
			if (v !== "" && v !== null && v !== undefined)
				params.set(k, String(v));
		});

		if (f.usage_types.length) {
			params.set("usage_types", f.usage_types.join(","));
		}

		return params.toString();
	};

	const load = async (page = 1, f = filters) => {
		setLoading(true);
		setError("");
		try {
			const resp = await fetch(
				`${API_BASE}/api/cropped-images/?${buildQuery(page, f)}`
			);
			if (!resp.ok) {
				const text = await resp.text();
				throw new Error(text || `HTTP ${resp.status}`);
			}
			const data = await resp.json();
			setItems(Array.isArray(data.results) ? data.results : []);
			setMeta({
				page: data.page || page,
				page_size: data.page_size || meta.page_size,
				count: data.count || 0,
			});
		} catch (e) {
			setError(e?.message || "Failed to load images");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load(1, filters);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const toggleFilterUsageType = (id) => {
		setFilters((prev) => {
			const has = prev.usage_types.includes(id);
			return {
				...prev,
				usage_types: has
					? prev.usage_types.filter((x) => x !== id)
					: [...prev.usage_types, id],
			};
		});
	};

	const totalPages = Math.max(
		1,
		Math.ceil((meta.count || 0) / meta.page_size)
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<TopNav />
			<div className="p-6">
				<div className="max-w-7xl mx-auto space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								FilterUpdate
							</h1>
							<div className="text-sm text-gray-600">
								Filter Cropped Images and update details
							</div>
						</div>
					</div>

					<div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">
									Class
								</label>
								<select
									value={filters.class_name}
									onChange={(e) =>
										setFilters((p) => ({
											...p,
											class_name: e.target.value,
											chapter: "",
											concept: "",
											topic: "",
										}))
									}
									className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
									<option value="">All</option>
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
									value={filters.subject}
									onChange={(e) =>
										setFilters((p) => ({
											...p,
											subject: e.target.value,
											chapter: "",
											concept: "",
											topic: "",
										}))
									}
									className="w-full border border-gray-200 rounded px-2 py-1 text-sm">
									<option value="">All</option>
									{options.subjects.map((t) => (
										<option key={t.id} value={t.id}>
											{t.name}
										</option>
									))}
								</select>
							</div>

							<SearchableSelect
								label="Chapter"
								value={filters.chapter}
								options={filteredChapters}
								onChange={(v) =>
									setFilters((p) => ({
										...p,
										chapter: v,
										concept: "",
										topic: "",
									}))
								}
								placeholder="Search chapter…"
							/>

							<SearchableSelect
								label="Concept"
								value={filters.concept}
								options={filteredConcepts}
								onChange={(v) =>
									setFilters((p) => ({
										...p,
										concept: v,
										topic: "",
									}))
								}
								placeholder="Search concept…"
							/>

							<SearchableSelect
								label="Topic"
								value={filters.topic}
								options={filteredTopics}
								onChange={(v) =>
									setFilters((p) => ({ ...p, topic: v }))
								}
								placeholder="Search topic…"
							/>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
							<ToggleGroup
								label="Type"
								value={filters.question_type}
								clearLabel="All"
								options={options.questionTypes.map((t) => ({
									value: t.id,
									label: t.name,
								}))}
								onChange={(v) =>
									setFilters((p) => ({
										...p,
										question_type: v,
									}))
								}
							/>

							<ToggleGroup
								label="Difficulty"
								value={filters.difficulty}
								clearLabel="All"
								options={[
									{ value: "easy", label: "Easy" },
									{ value: "medium", label: "Medium" },
									{ value: "hard", label: "Hard" },
								]}
								onChange={(v) =>
									setFilters((p) => ({ ...p, difficulty: v }))
								}
							/>

							<ToggleGroup
								label="Source"
								value={filters.source}
								clearLabel="All"
								options={options.sources.map((t) => ({
									value: t.id,
									label: t.name,
								}))}
								onChange={(v) =>
									setFilters((p) => ({ ...p, source: v }))
								}
							/>

							<ToggleGroup
								label="Status"
								value={filters.is_active}
								clearLabel="All"
								options={[
									{ value: "1", label: "Active" },
									{ value: "0", label: "Inactive" },
								]}
								onChange={(v) =>
									setFilters((p) => ({ ...p, is_active: v }))
								}
							/>

							<ToggleGroup
								label="Verified"
								value={filters.verified}
								clearLabel="All"
								options={[
									{ value: "1", label: "Verified" },
									{ value: "0", label: "Not verified" },
								]}
								onChange={(v) =>
									setFilters((p) => ({ ...p, verified: v }))
								}
							/>
							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">
									Usage
								</label>
								<div className="flex flex-wrap gap-2">
									{usageTypeOptions.map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() =>
												toggleFilterUsageType(opt.value)
											}
											className={`px-3 py-1 rounded border text-sm ${
												filters.usage_types.includes(
													opt.value
												)
													? "bg-gray-900 text-white border-gray-900"
													: "bg-white text-gray-800 border-gray-200"
											}`}>
											{opt.label}
										</button>
									))}
								</div>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">
									Priority
								</label>
								<input
									type="number"
									value={filters.priority}
									onChange={(e) =>
										setFilters((p) => ({
											...p,
											priority: e.target.value,
										}))
									}
									className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
									min={0}
								/>
							</div>

							<div>
								<label className="block text-xs font-medium text-gray-600 mb-1">
									Marks
								</label>
								<input
									type="number"
									value={filters.marks}
									onChange={(e) =>
										setFilters((p) => ({
											...p,
											marks: e.target.value,
										}))
									}
									className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
									min={0}
								/>
							</div>
						</div>
					</div>

					{error ? (
						<div className="bg-white border border-red-200 text-red-700 rounded-lg p-3 whitespace-pre-wrap">
							{error}
						</div>
					) : null}

					<div className="flex items-center justify-between">
						<div className="text-sm text-gray-600">
							Total: {meta.count} • Page {meta.page} /{" "}
							{totalPages}
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() =>
									load(Math.max(1, meta.page - 1), filters)
								}
								disabled={loading || meta.page <= 1}
								className="px-3 py-2 rounded border border-gray-200 bg-white text-sm disabled:opacity-60">
								Prev
							</button>
							<button
								type="button"
								onClick={() =>
									load(
										Math.min(totalPages, meta.page + 1),
										filters
									)
								}
								disabled={loading || meta.page >= totalPages}
								className="px-3 py-2 rounded border border-gray-200 bg-white text-sm disabled:opacity-60">
								Next
							</button>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						{items.map((it) => (
							<CroppedImageCard
								key={it.id}
								item={it}
								options={options}
								onSaved={(updated) => {
									setItems((prev) =>
										prev.map((x) =>
											x.id === updated.id ? updated : x
										)
									);
								}}
								onDeleted={(deletedId) => {
									setItems((prev) =>
										prev.filter((x) => x.id !== deletedId)
									);
									setMeta((prev) => ({
										...prev,
										count: Math.max(
											0,
											(prev.count || 0) - 1
										),
									}));
								}}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
