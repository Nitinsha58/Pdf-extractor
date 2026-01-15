import { Link } from "react-router-dom";

export default function Toolbar({
	openPdf,
	pdf,
	mode,
	setMode,
	sameQuestionMode,
	setSameQuestionMode,
	onUpload,
	isUploading,
	uploadProgress,
	classes,
	subjects,
	chapters,
	imageTypes,
	selectedClassId,
	setSelectedClassId,
	selectedSubjectId,
	setSelectedSubjectId,
	selectedChapterId,
	setSelectedChapterId,
	selectedImageTypeId,
	setSelectedImageTypeId,
}) {
	return (
		<div className="flex items-center gap-2 bg-white border-b border-gray-200 flex-wrap">
			<div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200 flex-wrap">
				<button
					onClick={openPdf}
					disabled={isUploading}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
					📂 Open PDF
				</button>
				<span className="px-4 py-2 bg-gray-100 rounded">
					Pages: {pdf?.ref?.numPages || "--"}
				</span>
				<div className="h-8 w-px bg-gray-300 mx-2"></div>
				<div className="flex items-center gap-2">
					<select
						value={selectedClassId || ""}
						onChange={(e) => {
							setSelectedClassId(e.target.value || null);
							setSelectedChapterId(null);
						}}
						disabled={isUploading}
						className="px-3 py-2 bg-white border border-gray-300 rounded">
						<option value="">Class</option>
						{(classes || []).map((c) => (
							<option key={c.id} value={String(c.id)}>
								{c.name}
							</option>
						))}
					</select>
					<select
						value={selectedSubjectId || ""}
						onChange={(e) => {
							setSelectedSubjectId(e.target.value || null);
							setSelectedChapterId(null);
						}}
						disabled={isUploading}
						className="px-3 py-2 bg-white border border-gray-300 rounded">
						<option value="">Subject</option>
						{(subjects || []).map((s) => (
							<option key={s.id} value={String(s.id)}>
								{s.name}
							</option>
						))}
					</select>
					<select
						value={selectedChapterId || ""}
						onChange={(e) =>
							setSelectedChapterId(e.target.value || null)
						}
						disabled={
							isUploading ||
							!selectedClassId ||
							!selectedSubjectId
						}
						className="px-3 py-2 bg-white border border-gray-300 rounded disabled:opacity-50">
						<option value="">Chapter</option>
						{(chapters || []).map((ch) => (
							<option key={ch.id} value={String(ch.id)}>
								{ch.name}
							</option>
						))}
					</select>
					<select
						value={selectedImageTypeId || ""}
						onChange={(e) =>
							setSelectedImageTypeId(e.target.value || null)
						}
						disabled={isUploading}
						className="px-3 py-2 bg-white border border-gray-300 rounded">
						{(imageTypes || []).map((t) => (
							<option key={t.id} value={String(t.id)}>
								{t.name}
							</option>
						))}
					</select>
					<label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded select-none">
						<input
							type="checkbox"
							checked={Boolean(sameQuestionMode)}
							onChange={(e) =>
								setSameQuestionMode?.(e.target.checked)
							}
							disabled={isUploading}
						/>
						<span className="text-sm text-gray-800">
							Same question
						</span>
					</label>
				</div>
				<div className="h-8 w-px bg-gray-300 mx-2"></div>
				<button
					onClick={() => setMode("draw")}
					disabled={isUploading}
					className={`px-4 py-2 rounded transition-colors ${
						mode === "draw"
							? "bg-blue-600 text-white border-2 border-blue-700"
							: "bg-white border border-gray-300 hover:bg-gray-100"
					}`}>
					✏️ Draw
				</button>
				<button
					onClick={onUpload}
					disabled={isUploading}
					className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
					{isUploading
						? `Uploading ${uploadProgress?.current || 0}/${
								uploadProgress?.total || 0
						  }`
						: "⬆️ Upload"}
				</button>
			</div>
			<div className="">
				<Link
					to="/home"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
					← Home
				</Link>
			</div>
		</div>
	);
}
