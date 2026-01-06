import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
	{ to: "/home", label: "Home" },
	{ to: "/", label: "Viewer" },
	{ to: "/classes", label: "Classes" },
	{ to: "/subject", label: "Subjects" },
	{ to: "/chapter", label: "Chapters" },
	{ to: "/concept", label: "Concepts" },
	{ to: "/filter-update", label: "FilterUpdate" },
	{ to: "/filter-images", label: "Filter Images" },
	{ to: "/view", label: "Questions" },
];

export default function TopNav() {
	const location = useLocation();
	const current = location?.pathname || "";

	return (
		<div className="w-full bg-white border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
				{NAV_LINKS.map((l) => {
					const active = current === l.to;
					return (
						<Link
							key={l.to}
							to={l.to}
							className={`px-3 py-1 rounded text-sm border ${
								active
									? "bg-gray-900 text-white border-gray-900"
									: "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
							}`}>
							{l.label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
