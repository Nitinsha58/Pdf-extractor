export default function CanvasOverlay({
	overlayRef,
	selections,
	rect,
	pageNo,
	activeSelection,
	onResizeHandleMouseDown,
}) {
	return (
		<div ref={overlayRef} className="absolute inset-0 pointer-events-none">
			{selections
				.filter((s) => s.pageNo === pageNo)
				.map((s) => {
					const boxNo =
						selections.findIndex((x) => x.id === s.id) + 1;
					return (
						<div
							key={s.id}
							className="absolute cursor-pointer"
							style={{
								left: s.rectScreen.x,
								top: s.rectScreen.y,
								width: s.rectScreen.w,
								height: s.rectScreen.h,
								border:
									s.id === activeSelection?.id
										? "2px solid #007bff"
										: "1px dashed #00aaff",
								background: "rgba(0,150,255,0.04)",
							}}>
							<div className="relative w-full h-full">
								<div className="absolute top-1 right-1 text-[10px] font-semibold bg-white/90 text-blue-700 border border-blue-600 rounded px-1.5 py-0.5 pointer-events-none select-none">
									{boxNo}
								</div>
								{s.id === activeSelection?.id &&
									[
										"nw",
										"n",
										"ne",
										"e",
										"se",
										"s",
										"sw",
										"w",
									].map((handle) => (
										<div
											key={handle}
											onMouseDown={(e) =>
												onResizeHandleMouseDown(
													e,
													handle
												)
											}
											className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded pointer-events-auto"
											style={{
												cursor: `${handle}-resize`,
												left: handle.includes("w")
													? -5
													: handle.includes("e")
													? s.rectScreen.w - 5
													: s.rectScreen.w / 2 - 5,
												top: handle.includes("n")
													? -5
													: handle.includes("s")
													? s.rectScreen.h - 5
													: s.rectScreen.h / 2 - 5,
											}}
										/>
									))}
							</div>
						</div>
					);
				})}

			{rect && (
				<div
					className="absolute border border-dashed border-blue-500 bg-blue-500/5 pointer-events-none"
					style={{
						left: rect.x,
						top: rect.y,
						width: rect.w,
						height: rect.h,
					}}
				/>
			)}
		</div>
	);
}
