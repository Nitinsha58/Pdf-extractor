import { useEffect, useMemo, useRef, useState } from "react";

export default function SearchableSelect({
	label,
	value,
	options,
	onChange,
	placeholder = "Search…",
	clearLabel = "All",
	disabled = false,
}) {
	const rootRef = useRef(null);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");

	const normalizedOptions = useMemo(() => {
		return (Array.isArray(options) ? options : []).map((o) => ({
			value: String(o.value),
			label: String(o.label ?? o.value),
		}));
	}, [options]);

	const selectedLabel = useMemo(() => {
		const selected = normalizedOptions.find(
			(o) => o.value === String(value ?? "")
		);
		return selected?.label || "";
	}, [normalizedOptions, value]);

	const filteredOptions = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return normalizedOptions;
		return normalizedOptions.filter((o) =>
			o.label.toLowerCase().includes(q)
		);
	}, [normalizedOptions, query]);

	useEffect(() => {
		if (!open) return;
		const onDocMouseDown = (e) => {
			if (!rootRef.current) return;
			if (!rootRef.current.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", onDocMouseDown);
		return () => document.removeEventListener("mousedown", onDocMouseDown);
	}, [open]);

	const commit = (nextValue) => {
		onChange(nextValue);
		setOpen(false);
		setQuery("");
	};

	return (
		<div ref={rootRef}>
			<label className="block text-xs font-medium text-gray-600 mb-1">
				{label}
			</label>
			<div className="relative">
				<input
					disabled={disabled}
					value={open ? query : selectedLabel}
					placeholder={placeholder}
					onFocus={() => {
						if (disabled) return;
						setOpen(true);
						setQuery(selectedLabel);
					}}
					onChange={(e) => {
						setOpen(true);
						setQuery(e.target.value);
					}}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setOpen(false);
							setQuery("");
							return;
						}
						if (e.key === "Enter") {
							e.preventDefault();
							if (query.trim() === "") return;
							const first = filteredOptions[0];
							if (first) commit(first.value);
						}
					}}
					className="w-full border border-gray-200 rounded px-2 py-1 text-sm bg-white"
				/>

				{open ? (
					<div className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded shadow-sm">
						<button
							type="button"
							onClick={() => commit("")}
							className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50">
							{clearLabel}
						</button>
						{filteredOptions.length ? (
							filteredOptions.map((o) => (
								<button
									key={o.value}
									type="button"
									onClick={() => commit(o.value)}
									className="w-full text-left px-2 py-2 text-sm hover:bg-gray-50">
									{o.label}
								</button>
							))
						) : (
							<div className="px-2 py-2 text-sm text-gray-500">
								No matches
							</div>
						)}
					</div>
				) : null}
			</div>
		</div>
	);
}
