export default function ToggleGroup({
	label,
	options,
	value,
	onChange,
	clearLabel = "All",
	showClear = true,
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="text-xs font-medium text-gray-600">{label}</div>
			<div className="flex flex-wrap gap-2">
				{showClear ? (
					<button
						type="button"
						onClick={() => onChange("")}
						className={`px-3 py-1 rounded border text-sm ${
							value === ""
								? "bg-gray-900 text-white border-gray-900"
								: "bg-white text-gray-800 border-gray-200"
						}`}>
						{clearLabel}
					</button>
				) : null}
				{options.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => onChange(String(opt.value))}
						className={`px-3 py-1 rounded border text-sm ${
							String(value) === String(opt.value)
								? "bg-gray-900 text-white border-gray-900"
								: "bg-white text-gray-800 border-gray-200"
						}`}>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	);
}
