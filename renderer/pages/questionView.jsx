import { useState, useEffect } from 'react';
import metadataJson from '../db/metadata.json';

export default function QuestionView() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            setData(metadataJson);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading questions...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Question View</h1>
                    <p className="text-gray-600">Total Questions: {data.length}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.map((item, index) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                        >
                            {/* Image */}
                            <div className="relative bg-gray-100 h-48">

                                <img
                                    src={item.filepath.replace('./', '../')}
                                    alt={`Question ${index + 1}`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                                <div className="absolute top-2 right-2">
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded ${item.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}
                                    >
                                        {item.status}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        Question #{index + 1}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Page {item.pageNo}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span className="font-medium">ID:</span>
                                        <span className="text-xs text-gray-500 truncate ml-2">
                                            {item.id.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Type:</span>
                                        <span>{item.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium">Status:</span>
                                        <span>{item.status}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}