import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";

const API_BASE = "http://localhost:8000";

export default function Subject() {
	const [data, setData] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [toast, setToast] = useState("");
	const [lastAddedId, setLastAddedId] = useState(null);
	const quickAddNameRef = useRef(null);
	const [quickAddName, setQuickAddName] = useState("");

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
			try {
				const resp = await fetch(`${API_BASE}/api/subjects/`);
				const json = resp.ok ? await resp.json() : [];
				setData((json || []).map((r) => ({ ...r, _status: "clean" })));
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, []);

	useEffect(() => {
		if (!toast) return;
		const t = setTimeout(() => setToast(""), 2200);
		return () => clearTimeout(t);
	}, [toast]);

	useEffect(() => {
		if (!lastAddedId) return;
		const el = document.querySelector(
			`input[data-subject-name-id="${CSS.escape(String(lastAddedId))}"]`
		);
		if (el && typeof el.focus === "function") el.focus();
		setLastAddedId(null);
	}, [lastAddedId]);

	const hasChanges = useMemo(
		() => data.some((r) => r._status && r._status !== "clean"),
		[data]
	);

	const handleAdd = () => {
		const tmpId = `tmp-${crypto.randomUUID?.() || Date.now()}`;
		setData((prev) => [...prev, { id: tmpId, name: "", _status: "new" }]);
		setLastAddedId(tmpId);
	};

	const addFromQuickAdd = () => {
		const name = (quickAddName || "").trim();
		if (!name) {
			setToast("Enter subject name.");
			quickAddNameRef.current?.focus?.();
			return;
		}
		const tmpId = `tmp-${crypto.randomUUID?.() || Date.now()}`;
		setData((prev) => [...prev, { id: tmpId, name, _status: "new" }]);
		setLastAddedId(tmpId);
		setQuickAddName("");
		queueMicrotask(() => quickAddNameRef.current?.focus?.());
	};

	const toggleSelected = (id) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const updateRowName = (id, name) => {
		setData((prev) =>
			prev.map((r) => {
				if (r.id !== id) return r;
				const nextStatus = r._status === "new" ? "new" : "updated";
				return { ...r, name, _status: nextStatus };
			})
		);
	};

	const deleteSelected = () => {
		if (!selectedIds.size) return;
		if (!confirm(`Delete ${selectedIds.size} item(s)?`)) return;

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

	const visibleData = useMemo(
		() => data.filter((r) => r._status !== "deleted"),
		[data]
	);

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
	}, [hasChanges, isSaving, data]);

	const saveChanges = async () => {
		if (!hasChanges || isSaving) return;

		const create = data
			.filter((r) => r._status === "new")
			.map((r) => ({ name: (r.name || "").trim() }))
			.filter((r) => r.name);

		const update = data
			.filter(
				(r) =>
					r._status === "updated" && !String(r.id).startsWith("tmp-")
			)
			.map((r) => ({ id: r.id, name: (r.name || "").trim() }));

		const del = data
			.filter(
				(r) =>
					r._status === "deleted" && !String(r.id).startsWith("tmp-")
			)
			.map((r) => r.id);

		setIsSaving(true);
		try {
			const resp = await fetch(`${API_BASE}/api/subjects/bulk/`, {
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
			const listResp = await fetch(`${API_BASE}/api/subjects/`);
			const json = listResp.ok ? await listResp.json() : [];
			setData((json || []).map((r) => ({ ...r, _status: "clean" })));
			setSelectedIds(new Set());
			setToast("Saved.");
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) return <div className="p-8">Loading...</div>;

	return (
		<div className="min-h-screen bg-gray-50">
			<TopNav />
			<div className="p-8 max-w-6xl mx-auto">
				{toast ? (
					<div className="fixed top-4 right-4 z-50">
						<div className="bg-white border border-gray-300 text-gray-900 px-4 py-3 rounded shadow-md max-w-sm text-sm">
							{toast}
						</div>
					</div>
				) : null}
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold">Subjects Management</h1>
					<div className="flex gap-3">
						<button
							onClick={handleAdd}
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
							Add New Subject
						</button>
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
							placeholder="New subject name (press Enter)"
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
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{visibleData.map((item) => (
								<tr key={item.id}>
									<td className="px-4 py-4">
										<input
											type="checkbox"
											checked={selectedIds.has(item.id)}
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
												updateRowName(
													item.id,
													e.target.value
												)
											}
											data-subject-name-id={String(
												item.id
											)}
											className="border rounded px-2 py-1 w-full"
											placeholder="Subject name"
										/>
									</td>
									<td className="px-6 py-4">
										<button
											onClick={() => deleteOne(item.id)}
											className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600">
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
