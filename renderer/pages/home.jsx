import { Link } from "react-router-dom";

export default function Home() {
	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-3xl mx-auto">
				<h1 className="text-3xl font-bold mb-2">PdfApp</h1>
				<p className="text-gray-600 mb-6">Choose where to go:</p>

				<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
					<Link
						to="/"
						className="block px-5 py-4 hover:bg-gray-50 border-b border-gray-200">
						<div className="font-medium">PDF Viewer</div>
						<div className="text-sm text-gray-600">
							Draw boxes and upload
						</div>
					</Link>
					<Link
						to="/classes"
						className="block px-5 py-4 hover:bg-gray-50 border-b border-gray-200">
						<div className="font-medium">Classes</div>
						<div className="text-sm text-gray-600">
							Bulk create/update/delete
						</div>
					</Link>
					<Link
						to="/subject"
						className="block px-5 py-4 hover:bg-gray-50 border-b border-gray-200">
						<div className="font-medium">Subjects</div>
						<div className="text-sm text-gray-600">
							Bulk create/update/delete
						</div>
					</Link>
					<Link
						to="/chapter"
						className="block px-5 py-4 hover:bg-gray-50">
						<div className="font-medium">Chapters</div>
						<div className="text-sm text-gray-600">
							Bulk create/update/delete
						</div>
					</Link>
					<Link
						to="/concept"
						className="block px-5 py-4 hover:bg-gray-50 border-t border-gray-200">
						<div className="font-medium">Concepts</div>
						<div className="text-sm text-gray-600">
							Manage concepts by chapter
						</div>
					</Link>
					<Link
						to="/filter-update"
						className="block px-5 py-4 hover:bg-gray-50 border-t border-gray-200">
						<div className="font-medium">FilterUpdate</div>
						<div className="text-sm text-gray-600">
							Filter and update cropped images
						</div>
					</Link>
					<Link
						to="/filter-images"
						className="block px-5 py-4 hover:bg-gray-50 border-t border-gray-200">
						<div className="font-medium">Filter Images</div>
						<div className="text-sm text-gray-600">
							Filter and copy images only
						</div>
					</Link>
				</div>
			</div>
		</div>
	);
}
