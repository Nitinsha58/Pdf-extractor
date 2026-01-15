import { useEffect, useRef, useState } from "react";

export default function SelectionList({
	deleteSpecificSelection,
	selections,
	activeId,
	onSelect,
	onUpdateSelection,
	disabled,
}) {
	const itemRefs = useRef({});
	const [imageTypes, setImageTypes] = useState([]);

	const getGroupKey = (sel, fallback) =>
		sel?.questionGroupKey ||
		sel?.groupKey ||
		sel?.question_group ||
		sel?.questionGroup ||
		sel?.id ||
		`__single__${fallback}`;

	const labelById = (() => {
		const groupOrder = [];
		const groupNoByKey = new Map();
		const nextSubIndexByKey = new Map();
		const out = {};

		(selections || []).forEach((sel, i) => {
			const key = String(getGroupKey(sel, i));
			if (!groupNoByKey.has(key)) {
				groupOrder.push(key);
				groupNoByKey.set(key, groupOrder.length);
				nextSubIndexByKey.set(key, 1);
			}
			const groupNo = groupNoByKey.get(key);
			const subIndex = nextSubIndexByKey.get(key) || 1;
			nextSubIndexByKey.set(key, subIndex + 1);
			out[sel.id] =
				subIndex === 1 ? String(groupNo) : `${groupNo}.${subIndex}`;
		});

		return out;
	})();

	const API_BASE = "http://localhost:8000";

	useEffect(() => {
		let isMounted = true;
		const loadImageTypes = async () => {
			try {
				const resp = await fetch(`${API_BASE}/api/image-types/`);
				if (!resp.ok) return;
				const data = await resp.json();
				if (isMounted) setImageTypes(Array.isArray(data) ? data : []);
			} catch {
				// ignore
			}
		};
		loadImageTypes();
		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (!activeId) return;
		const el = itemRefs.current?.[activeId];
		if (!el) return;
		el.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [activeId, selections.length]);

	return (
		<div
			className={`w-fit shrink-0 border-l border-gray-300 p-4 overflow-y-auto bg-white ${
				disabled ? "opacity-70" : ""
			}`}>
			<div className="relative mb-4">
				<h3 className="text-lg font-bold text-gray-800">Selections</h3>
				<span className="absolute top-0 right-0 text-xs font-semibold bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">
					{selections.length}
				</span>
			</div>

			{!selections.length && (
				<p className="text-gray-500 text-sm">No selections yet</p>
			)}

			{selections.map((sel, idx) => {
				const isActive = sel.id === activeId;
				const label = labelById[sel.id] || String(idx + 1);
				return (
					<div
						key={sel.id}
						ref={(el) => {
							if (el) itemRefs.current[sel.id] = el;
						}}
						onClick={() => {
							if (disabled) return;
							onSelect(sel.id);
						}}
						className={`relative p-3 mb-2 rounded-lg cursor-pointer transition-all ${
							isActive
								? "border-2 border-blue-600 shadow-md"
								: "border border-gray-300 hover:border-gray-400"
						} ${
							sel.status === "saved"
								? "bg-green-50"
								: "bg-gray-50"
						}`}>
						<span className="absolute top-2 right-2 text-xs font-semibold bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">
							{label}
						</span>
						<div className="text-sm mb-1">
							<span className="font-semibold text-gray-700">
								Page:
							</span>{" "}
							<span className="text-gray-900">{sel.pageNo}</span>
						</div>
						<div className="text-sm mb-1">
							<span className="font-semibold text-gray-700">
								Class:
							</span>{" "}
							<span className="text-gray-900">
								{sel.className || sel.classId || "-"}
							</span>
						</div>
						<div className="text-sm mb-1">
							<span className="font-semibold text-gray-700">
								Subject:
							</span>{" "}
							<span className="text-gray-900">
								{sel.subjectName || sel.subjectId || "-"}
							</span>
						</div>
						<div className="text-sm mb-1">
							<span className="font-semibold text-gray-700">
								Chapter:
							</span>{" "}
							<span className="text-gray-900">
								{sel.chapterName || sel.chapterId || "-"}
							</span>
						</div>
						<div className="text-sm mb-1">
							<span className="font-semibold text-gray-700">
								Image Type:
							</span>{" "}
							<select
								onClick={(e) => e.stopPropagation()}
								onMouseDown={(e) => e.stopPropagation()}
								value={sel.imageTypeId || ""}
								onChange={(e) => {
									if (disabled) return;
									const nextId = e.target.value || null;
									const found = (imageTypes || []).find(
										(t) => String(t.id) === String(nextId)
									);
									onUpdateSelection?.({
										...sel,
										imageTypeId: nextId,
										imageTypeName: found?.name || "",
									});
								}}
								disabled={disabled}
								className="px-2 py-1 bg-white border border-gray-300 rounded text-sm">
								{(imageTypes || []).map((t) => (
									<option key={t.id} value={String(t.id)}>
										{t.name}
									</option>
								))}
							</select>
						</div>
						<div className="flex justify-end mt-2">
							<button
								onClick={(e) => {
									e.stopPropagation();
									if (disabled) return;
									deleteSpecificSelection(sel.id);
								}}
								disabled={disabled}
								className="p-1 rounded hover:bg-red-50 text-red-600"
								aria-label="Delete selection"
								title="Delete">
								<svg
									viewBox="0 0 24 24"
									width="20"
									height="20"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round">
									<path d="M3 6h18" />
									<path d="M8 6V4h8v2" />
									<path d="M19 6l-1 14H6L5 6" />
									<path d="M10 11v6" />
									<path d="M14 11v6" />
								</svg>
							</button>
						</div>
					</div>
				);
			})}
		</div>
	);
}
