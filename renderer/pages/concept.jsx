import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

const API_BASE = "http://localhost:8000";

export default function Concept() {
	const [classes, setClasses] = useState([]);
	const [subjects, setSubjects] = useState([]);
	const [allChapters, setAllChapters] = useState([]);
	const [selectedClassId, setSelectedClassId] = useState("");
	const [selectedSubjectId, setSelectedSubjectId] = useState("");
	const [selectedChapterId, setSelectedChapterId] = useState("");

	const [data, setData] = useState([]);
	const [topics, setTopics] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [toast, setToast] = useState("");
	const draggingTopicIdRef = useRef(null);
	const [topicDrafts, setTopicDrafts] = useState({});

	const visibleTopics = useMemo(
		() => topics.filter((t) => t._status !== "deleted"),
		[topics]
	);
	const topicsByConceptId = useMemo(() => {
		const map = new Map();
		for (const t of visibleTopics) {
			const list = map.get(t.conceptId) || [];
			list.push(t);
			map.set(t.conceptId, list);
		}
		return map;
	}, [visibleTopics]);

	const addTopicUnderConcept = useCallback((conceptId, name) => {
		const trimmed = (name || "").trim();
		if (!trimmed) return;
		const tmpId = `tmp-topic-${Date.now()}-${Math.random()
			.toString(16)
			.slice(2)}`;
		setTopics((prev) => [
			{
				id: tmpId,
				name: trimmed,
				conceptId,
				_status: "new",
			},
			...prev,
		]);
		setTopicDrafts((prev) => ({ ...prev, [conceptId]: "" }));
	}, []);

	const updateTopic = useCallback((id, patch) => {
		setTopics((prev) =>
			prev.map((t) => {
				if (t.id !== id) return t;
				const next = { ...t, ...patch };
				if (next._status === "clean") next._status = "updated";
				return next;
			})
		);
	}, []);

	const deleteTopic = useCallback((id) => {
		setTopics((prev) =>
			prev
				.map((t) => {
					if (t.id !== id) return t;
					if (String(t.id).startsWith("tmp-"))
						return { ...t, _status: "deleted" };
					return { ...t, _status: "deleted" };
				})
				.filter(
					(t) =>
						!(
							String(t.id).startsWith("tmp-") &&
							t._status === "deleted"
						)
				)
		);
	}, []);

	const onTopicDragStart = useCallback((topicId) => {
		draggingTopicIdRef.current = topicId;
	}, []);

	const onTopicDropOnConcept = useCallback(
		(conceptId) => {
			const topicId = draggingTopicIdRef.current;
			draggingTopicIdRef.current = null;
			if (!topicId) return;
			const current = topics.find((t) => t.id === topicId);
			if (!current) return;
			if (current.conceptId === conceptId) return;
			updateTopic(topicId, { conceptId });
		},
		[topics, updateTopic]
	);

	const quickAddNameRef = useRef(null);
	const [quickAddName, setQuickAddName] = useState("");
	const [lastAddedId, setLastAddedId] = useState(null);

	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(""), 2200);
		return () => clearTimeout(t);
	}, [toast]);

	const chapterOptions = useMemo(() => {
		let list = allChapters;
		if (selectedClassId) {
			list = list.filter(
				(ch) => String(ch.class_name_id) === String(selectedClassId)
			);
		}
		if (selectedSubjectId) {
			list = list.filter(
				(ch) => String(ch.subject_id) === String(selectedSubjectId)
			);
		}
		return list;
	}, [allChapters, selectedClassId, selectedSubjectId]);

	const chapterById = useMemo(() => {
		const map = new Map();
		for (const ch of allChapters) map.set(String(ch.id), ch);
		return map;
	}, [allChapters]);

	const hasChanges = useMemo(() => {
		const conceptDirty = data.some(
			(r) => r._status && r._status !== "clean"
		);
		const topicDirty = topics.some(
			(t) => t._status && t._status !== "clean"
		);
		return conceptDirty || topicDirty;
	}, [data, topics]);

	const visibleData = useMemo(
		() => data.filter((r) => r._status !== "deleted"),
		[data]
	);

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			try {
				const [cResp, sResp, chResp] = await Promise.all([
					fetch(`${API_BASE}/api/classes/`),
					fetch(`${API_BASE}/api/subjects/`),
					fetch(`${API_BASE}/api/chapters/`),
				]);
				const cJson = cResp.ok ? await cResp.json() : [];
				const sJson = sResp.ok ? await sResp.json() : [];
				const chJson = chResp.ok ? await chResp.json() : [];

				setClasses(cJson || []);
				setSubjects(sJson || []);
				setAllChapters(chJson || []);

				const initialClass = cJson?.[0]?.id || "";
				const initialSubject = sJson?.[0]?.id || "";
				setSelectedClassId(initialClass);
				setSelectedSubjectId(initialSubject);

				// pick first chapter matching class+subject (if any)
				const initialChapter = (chJson || []).find(
					(ch) =>
						(!initialClass ||
							String(ch.class_name_id) ===
								String(initialClass)) &&
						(!initialSubject ||
							String(ch.subject_id) === String(initialSubject))
				)?.id;
				setSelectedChapterId(initialChapter || "");
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, []);

	useEffect(() => {
		if (!selectedChapterId) {
			setData([]);
			setTopics([]);
			setTopicDrafts({});
			setSelectedIds(new Set());
			return;
		}
		const loadConcepts = async () => {
			setIsLoading(true);
			try {
				const [cResp, tResp] = await Promise.all([
					fetch(
						`${API_BASE}/api/concepts/?chapter_id=${encodeURIComponent(
							selectedChapterId
						)}`
					),
					fetch(
						`${API_BASE}/api/topics/?chapter_id=${encodeURIComponent(
							selectedChapterId
						)}`
					),
				]);
				const json = cResp.ok ? await cResp.json() : [];
				const tJson = tResp.ok ? await tResp.json() : [];
				setData(
					(json || []).map((r) => ({
						id: r.id,
						name: r.name,
						chapterId: r.chapter_id,
						_status: "clean",
					}))
				);
				setTopics(
					(tJson || []).map((t) => ({
						id: t.id,
						name: t.name,
						conceptId: t.concept_id,
						_status: "clean",
					}))
				);
				setTopicDrafts({});
				setSelectedIds(new Set());
			} finally {
				setIsLoading(false);
			}
		};
		loadConcepts();
	}, [selectedChapterId]);

	useEffect(() => {
		if (!lastAddedId) return;
		const el = document.querySelector(
			`input[data-concept-name-id="${CSS.escape(String(lastAddedId))}"]`
		);
		if (el && typeof el.focus === "function") el.focus();
		setLastAddedId(null);
	}, [lastAddedId]);

	const syncSelectedChapterIfMissing = (nextClassId, nextSubjectId) => {
		if (!selectedChapterId) return;
		const current = chapterById.get(String(selectedChapterId));
		if (!current) return;
		if (
			(nextClassId &&
				String(current.class_name_id) !== String(nextClassId)) ||
			(nextSubjectId &&
				String(current.subject_id) !== String(nextSubjectId))
		) {
			const first = allChapters.find(
				(ch) =>
					(!nextClassId ||
						String(ch.class_name_id) === String(nextClassId)) &&
					(!nextSubjectId ||
						String(ch.subject_id) === String(nextSubjectId))
			);
			setSelectedChapterId(first?.id || "");
		}
	};

	const toggleSelected = (id) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const updateRow = (id, patch) => {
		setData((prev) =>
			prev.map((r) => {
				if (r.id !== id) return r;
				const nextStatus = r._status === "new" ? "new" : "updated";
				return { ...r, ...patch, _status: nextStatus };
			})
		);
	};

	const addFromQuickAdd = () => {
		const name = (quickAddName || "").trim();
		if (!selectedChapterId) {
			setToast("Select a chapter first.");
			return;
		}
		if (!name) {
			setToast("Enter concept name.");
			quickAddNameRef.current?.focus?.();
			return;
		}
		const tmpId = `tmp-${crypto.randomUUID?.() || Date.now()}`;
		setData((prev) => [
			...prev,
			{
				id: tmpId,
				name,
				chapterId: Number(selectedChapterId),
				_status: "new",
			},
		]);
		setLastAddedId(tmpId);
		setQuickAddName("");
		queueMicrotask(() => quickAddNameRef.current?.focus?.());
	};

	const deleteSelected = () => {
		if (!selectedIds.size) return;
		if (!confirm(`Delete ${selectedIds.size} concept(s)?`)) return;

		setData((prev) =>
			prev
				.map((r) => {
					if (!selectedIds.has(r.id)) return r;
					if (String(r.id).startsWith("tmp-")) return null;
					return { ...r, _status: "deleted" };
				})
				.filter(Boolean)
		);
		setSelectedIds(new Set());
	};

	const deleteOne = (id) => {
		setData((prev) => {
			const next = [];
			for (const row of prev) {
				if (row.id !== id) {
					next.push(row);
					continue;
				}
				if (String(row.id).startsWith("tmp-")) continue;
				next.push({ ...row, _status: "deleted" });
			}
			return next;
		});
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	};

	const saveChanges = async () => {
		if (!hasChanges || isSaving) return;

		const hasConceptChanges = data.some(
			(r) => r._status && r._status !== "clean"
		);
		const hasTmpConceptRefsInTopics = topics.some((t) =>
			String(t.conceptId || "").startsWith("tmp-")
		);

		const create = data
			.filter((r) => r._status === "new")
			.map((r) => ({
				client_id: r.id,
				name: (r.name || "").trim(),
				chapter: r.chapterId,
			}))
			.filter((r) => r.name && r.chapter);

		const update = data
			.filter(
				(r) =>
					r._status === "updated" && !String(r.id).startsWith("tmp-")
			)
			.map((r) => ({
				id: r.id,
				name: (r.name || "").trim(),
				chapter: r.chapterId,
			}));

		const del = data
			.filter(
				(r) =>
					r._status === "deleted" && !String(r.id).startsWith("tmp-")
			)
			.map((r) => r.id);

		const topicCreateRaw = topics
			.filter((t) => t._status === "new")
			.map((t) => ({
				name: (t.name || "").trim(),
				concept: t.conceptId,
			}))
			.filter((t) => t.name && t.concept);

		const topicUpdateRaw = topics
			.filter(
				(t) =>
					t._status === "updated" && !String(t.id).startsWith("tmp-")
			)
			.map((t) => ({
				id: t.id,
				name: (t.name || "").trim(),
				concept: t.conceptId,
			}))
			.filter((t) => t.id && t.name && t.concept);

		const topicDel = topics
			.filter(
				(t) =>
					t._status === "deleted" && !String(t.id).startsWith("tmp-")
			)
			.map((t) => t.id);

		setIsSaving(true);
		try {
			let createdIdMap = new Map();
			if (hasConceptChanges || hasTmpConceptRefsInTopics) {
				const resp = await fetch(`${API_BASE}/api/concepts/bulk/`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ create, update, delete: del }),
				});
				if (!resp.ok) {
					const txt = await resp.text();
					console.error("Save failed", txt);
					setToast("Save failed.");
					return;
				}
				const bulkJson = await resp.json().catch(() => ({}));
				const pairs = bulkJson?.created_id_map || [];
				for (const p of pairs) {
					if (!p) continue;
					createdIdMap.set(String(p.client_id), p.id);
				}
			}

			const resolveConceptId = (conceptId) => {
				if (conceptId == null) return null;
				const s = String(conceptId);
				if (!s.startsWith("tmp-")) return conceptId;
				return createdIdMap.get(s) || null;
			};

			let skippedTopics = 0;
			const topicCreate = topicCreateRaw
				.map((t) => ({
					name: t.name,
					concept: resolveConceptId(t.concept),
				}))
				.filter((t) => {
					if (t.name && t.concept) return true;
					skippedTopics += 1;
					return false;
				});

			const topicUpdate = topicUpdateRaw
				.map((t) => ({
					id: t.id,
					name: t.name,
					concept: resolveConceptId(t.concept),
				}))
				.filter((t) => {
					if (t.id && t.name && t.concept) return true;
					skippedTopics += 1;
					return false;
				});

			if (topicCreate.length || topicUpdate.length || topicDel.length) {
				const tResp = await fetch(`${API_BASE}/api/topics/bulk/`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						create: topicCreate,
						update: topicUpdate,
						delete: topicDel,
					}),
				});
				if (!tResp.ok) {
					const txt = await tResp.text();
					console.error("Topic save failed", txt);
					setToast("Topics save failed.");
				}
			}

			// Reload concepts + topics for selected chapter
			const [listResp, tListResp] = await Promise.all([
				fetch(
					`${API_BASE}/api/concepts/?chapter_id=${encodeURIComponent(
						selectedChapterId
					)}`
				),
				fetch(
					`${API_BASE}/api/topics/?chapter_id=${encodeURIComponent(
						selectedChapterId
					)}`
				),
			]);
			const json = listResp.ok ? await listResp.json() : [];
			const tJson = tListResp.ok ? await tListResp.json() : [];
			setData(
				(json || []).map((r) => ({
					id: r.id,
					name: r.name,
					chapterId: r.chapter_id,
					_status: "clean",
				}))
			);
			setTopics(
				(tJson || []).map((t) => ({
					id: t.id,
					name: t.name,
					conceptId: t.concept_id,
					_status: "clean",
				}))
			);
			setSelectedIds(new Set());
			setToast(skippedTopics ? "Saved (some topics skipped)." : "Saved.");
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		const onKeyDown = (e) => {
			const isSave =
				(e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === "s";
			if (!isSave) return;
			if (!hasChanges || isSaving) return;
			e.preventDefault();
			saveChanges();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [hasChanges, isSaving, data, topics]);

	if (isLoading && !classes.length)
		return <div className="p-8">Loading...</div>;

	return (
		<div className="min-h-screen bg-gray-50">
			<TopNav />
			<div className="p-8 max-w-7xl mx-auto">
				{toast ? (
					<div className="fixed top-4 right-4 z-50">
						<div className="bg-white border border-gray-300 text-gray-900 px-4 py-3 rounded shadow-md max-w-sm text-sm">
							{toast}
						</div>
					</div>
				) : null}

				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold">Concepts Management</h1>
					<div className="flex gap-3">
						<button
							onClick={deleteSelected}
							disabled={!selectedIds.size}
							className={`px-4 py-2 rounded ${
								selectedIds.size
									? "bg-red-500 text-white hover:bg-red-600"
									: "bg-gray-300 text-gray-500 cursor-not-allowed"
							}`}>
							Delete Selected
						</button>
						<button
							onClick={saveChanges}
							disabled={!hasChanges || isSaving}
							className={`px-6 py-2 rounded font-medium ${
								hasChanges && !isSaving
									? "bg-green-500 text-white hover:bg-green-600"
									: "bg-gray-300 text-gray-500 cursor-not-allowed"
							}`}>
							{isSaving ? "Saving..." : "Save Changes"}
						</button>
					</div>
				</div>

				<div className="bg-white shadow rounded-lg p-4 mb-4">
					<div className="grid grid-cols-12 gap-3 items-center">
						<div className="col-span-12 md:col-span-3">
							<label className="block text-xs font-medium text-gray-500 uppercase mb-1">
								Class
							</label>
							<select
								value={selectedClassId || ""}
								onChange={(e) => {
									const v = Number(e.target.value);
									setSelectedClassId(v);
									syncSelectedChapterIfMissing(
										v,
										selectedSubjectId
									);
								}}
								className="border rounded px-3 py-2 w-full">
								{classes.map((cls) => (
									<option key={cls.id} value={cls.id}>
										{cls.name}
									</option>
								))}
							</select>
						</div>
						<div className="col-span-12 md:col-span-3">
							<label className="block text-xs font-medium text-gray-500 uppercase mb-1">
								Subject
							</label>
							<select
								value={selectedSubjectId || ""}
								onChange={(e) => {
									const v = Number(e.target.value);
									setSelectedSubjectId(v);
									syncSelectedChapterIfMissing(
										selectedClassId,
										v
									);
								}}
								className="border rounded px-3 py-2 w-full">
								{subjects.map((subj) => (
									<option key={subj.id} value={subj.id}>
										{subj.name}
									</option>
								))}
							</select>
						</div>
						<div className="col-span-12 md:col-span-6">
							<label className="block text-xs font-medium text-gray-500 uppercase mb-1">
								Chapter
							</label>
							<select
								value={selectedChapterId || ""}
								onChange={(e) =>
									setSelectedChapterId(Number(e.target.value))
								}
								className="border rounded px-3 py-2 w-full">
								<option value="">Select chapter</option>
								{chapterOptions.map((ch) => (
									<option key={ch.id} value={ch.id}>
										{ch.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className="bg-white shadow rounded-lg p-4 mb-4">
					<div className="flex gap-3 items-center">
						<input
							ref={quickAddNameRef}
							type="text"
							value={quickAddName}
							onChange={(e) => setQuickAddName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") addFromQuickAdd();
							}}
							className="border rounded px-3 py-2 w-full"
							placeholder="New concept name (press Enter)"
						/>
						<button
							onClick={addFromQuickAdd}
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
							Add
						</button>
					</div>
				</div>

				{hasChanges && (
					<div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
						You have unsaved changes
					</div>
				)}

				<div className="bg-white shadow rounded-lg overflow-hidden">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									<input
										type="checkbox"
										checked={
											selectedIds.size ===
												visibleData.length &&
											visibleData.length > 0
										}
										onChange={(e) => {
											const checked = e.target.checked;
											setSelectedIds(
												checked
													? new Set(
															visibleData.map(
																(r) => r.id
															)
													  )
													: new Set()
											);
										}}
									/>
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									ID
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Chapter
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Class
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Subject
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{visibleData.map((item) => {
								const ch = chapterById.get(
									String(item.chapterId)
								);
								const conceptId = item.id;
								const isTmpConcept =
									String(conceptId).startsWith("tmp-");
								const conceptTopics =
									topicsByConceptId.get(conceptId) || [];
								const topicDraft = topicDrafts[conceptId] || "";

								return (
									<Fragment key={item.id}>
										<tr
											onDragOver={(e) =>
												e.preventDefault()
											}
											onDrop={() =>
												onTopicDropOnConcept(conceptId)
											}>
											<td className="px-4 py-4">
												<input
													type="checkbox"
													checked={selectedIds.has(
														item.id
													)}
													onChange={() =>
														toggleSelected(item.id)
													}
												/>
											</td>
											<td className="px-6 py-4 text-sm text-gray-500">
												{item.id}
											</td>
											<td className="px-6 py-4">
												<input
													type="text"
													value={item.name || ""}
													onChange={(e) =>
														updateRow(item.id, {
															name: e.target
																.value,
														})
													}
													data-concept-name-id={String(
														item.id
													)}
													className="border rounded px-2 py-1 w-full"
													placeholder="Concept name"
												/>
											</td>
											<td className="px-6 py-4">
												<select
													value={item.chapterId || ""}
													onChange={(e) =>
														updateRow(item.id, {
															chapterId: Number(
																e.target.value
															),
														})
													}
													className="border rounded px-2 py-1 w-full">
													{allChapters.map((c) => (
														<option
															key={c.id}
															value={c.id}>
															{c.name} (
															{c.class_name?.name}{" "}
															- {c.subject?.name})
														</option>
													))}
												</select>
											</td>
											<td className="px-6 py-4 text-sm text-gray-900">
												<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
													{ch?.class_name?.name ||
														"Unknown"}
												</span>
											</td>
											<td className="px-6 py-4 text-sm text-gray-900">
												<span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
													{ch?.subject?.name ||
														"Unknown"}
												</span>
											</td>
											<td className="px-6 py-4">
												<button
													onClick={() =>
														deleteOne(item.id)
													}
													className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600">
													Delete
												</button>
											</td>
										</tr>
										<tr className="bg-gray-50">
											<td
												className="px-4 py-3"
												colSpan={7}>
												<div className="flex flex-col gap-2">
													<div className="flex items-center gap-3">
														<span className="text-xs font-medium text-gray-600 uppercase">
															Topics
														</span>
														<span className="text-xs text-gray-500">
															(
															{
																conceptTopics.length
															}
															)
														</span>
													</div>

													<div className="flex flex-wrap gap-2 items-center">
														{conceptTopics.map(
															(t) => (
																<div
																	key={t.id}
																	draggable
																	onDragStart={(
																		e
																	) => {
																		e.dataTransfer?.setData(
																			"text/plain",
																			String(
																				t.id
																			)
																		);
																		onTopicDragStart(
																			t.id
																		);
																	}}
																	className="bg-white border border-gray-200 rounded px-2 py-1 flex items-center gap-2">
																	<span className="text-xs text-gray-400 select-none">
																		⇅
																	</span>
																	<input
																		type="text"
																		value={
																			t.name ||
																			""
																		}
																		onChange={(
																			e
																		) =>
																			updateTopic(
																				t.id,
																				{
																					name: e
																						.target
																						.value,
																				}
																			)
																		}
																		className="border rounded px-2 py-1 text-sm"
																		placeholder="Topic"
																	/>
																	<button
																		onClick={() =>
																			deleteTopic(
																				t.id
																			)
																		}
																		className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600">
																		Delete
																	</button>
																</div>
															)
														)}

														<div className="flex items-center gap-2">
															<input
																type="text"
																value={
																	topicDraft
																}
																disabled={false}
																onChange={(e) =>
																	setTopicDrafts(
																		(
																			prev
																		) => ({
																			...prev,
																			[conceptId]:
																				e
																					.target
																					.value,
																		})
																	)
																}
																onKeyDown={(
																	e
																) => {
																	if (
																		e.key !==
																		"Enter"
																	)
																		return;
																	addTopicUnderConcept(
																		conceptId,
																		topicDraft
																	);
																}}
																className="border rounded px-3 py-2"
																placeholder="Add topic (Enter)"
															/>
															<button
																onClick={() =>
																	addTopicUnderConcept(
																		conceptId,
																		topicDraft
																	)
																}
																disabled={false}
																className="px-3 py-2 rounded text-sm bg-blue-500 text-white hover:bg-blue-600">
																Add
															</button>
														</div>
													</div>
												</div>
											</td>
										</tr>
									</Fragment>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="mt-4 text-sm text-gray-600">
					Showing {visibleData.length} concept(s)
				</div>
			</div>
		</div>
	);
}
