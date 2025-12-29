import { useState, useEffect, useMemo } from 'react';
import metadataJson from '../db/metadata.json';

export default function QuestionView() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Relation data
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [concepts, setConcepts] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        classId: '',
        subjectId: '',
        chapterId: '',
        conceptId: '',
        type: '',
        status: '',
        searchText: ''
    });

    // Load relation data
    useEffect(() => {
        const fetchRelationData = async () => {


            const savedClasses = localStorage.getItem('classes');
            setClasses(savedClasses ? JSON.parse(savedClasses) : []);

            const savedSubjects = localStorage.getItem('subject');
            setSubjects(savedSubjects ? JSON.parse(savedSubjects) : []);

            const savedChapters = localStorage.getItem('chapter');
            setChapters(savedChapters ? JSON.parse(savedChapters) : []);

            const savedConcepts = localStorage.getItem('concept');
            setConcepts(savedConcepts ? JSON.parse(savedConcepts) : []);
            console.log(classes, chapters, subjects, concepts);
        };
        fetchRelationData();
    }, []);

    useEffect(() => {
        try {
            setData(metadataJson);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, []);

    // Helper function to get related data
    const getRelatedData = (item) => {
        const concept = concepts.find(c => c.id === item.conceptId);
        const chapter = concept ? chapters.find(ch => ch.id === concept.chapterId) : null;
        const subject = chapter ? subjects.find(s => s.id === chapter.subjectId) : null;
        const classData = chapter ? classes.find(cl => cl.id === chapter.classId) : null;

        return { concept, chapter, subject, classData };
    };

    // Filter data based on active filters
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const { concept, chapter } = getRelatedData(item);

            // Filter by hierarchy
            if (filters.classId && chapter?.classId !== filters.classId) return false;
            if (filters.subjectId && chapter?.subjectId !== filters.subjectId) return false;
            if (filters.chapterId && concept?.chapterId !== filters.chapterId) return false;
            if (filters.conceptId && item.conceptId !== filters.conceptId) return false;

            // Filter by type and status
            if (filters.type && item.type !== filters.type) return false;
            if (filters.status && item.status !== filters.status) return false;

            // Search text filter
            if (filters.searchText) {
                const searchLower = filters.searchText.toLowerCase();
                const matchesId = item.id.toLowerCase().includes(searchLower);
                const matchesPage = item.pageNo.toString().includes(searchLower);
                const matchesConcept = concept?.name.toLowerCase().includes(searchLower);
                const matchesChapter = chapter?.name.toLowerCase().includes(searchLower);

                if (!matchesId && !matchesPage && !matchesConcept && !matchesChapter) {
                    return false;
                }
            }

            return true;
        });
    }, [data, filters, concepts, chapters, subjects, classes]);

    // Get unique values for filter dropdowns
    const getUniqueValues = (field) => {
        const values = new Set();
        data.forEach(item => {
            const { concept, chapter } = getRelatedData(item);

            switch (field) {
                case 'classId':
                    if (chapter?.classId) values.add(chapter.classId);
                    break;
                case 'subjectId':
                    if (chapter?.subjectId) values.add(chapter.subjectId);
                    break;
                case 'chapterId':
                    if (concept?.chapterId) values.add(concept.chapterId);
                    break;
                case 'conceptId':
                    if (item.conceptId) values.add(item.conceptId);
                    break;
                case 'type':
                    if (item.type) values.add(item.type);
                    break;
                case 'status':
                    if (item.status) values.add(item.status);
                    break;
            }
        });
        return Array.from(values);
    };

    const resetFilters = () => {
        setFilters({
            classId: '',
            subjectId: '',
            chapterId: '',
            conceptId: '',
            type: '',
            status: '',
            searchText: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

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
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Question View</h1>
                    <p className="text-gray-600">
                        Showing {filteredData.length} of {data.length} questions
                        {hasActiveFilters && " (filtered)"}
                    </p>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Filters {hasActiveFilters && "🔵"}
                        </h2>
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-4">
                            <input
                                type="text"
                                placeholder="Search by ID, page, concept, or chapter..."
                                value={filters.searchText}
                                onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Class Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Class
                            </label>
                            <select
                                value={filters.classId}
                                onChange={(e) => setFilters(prev => ({ ...prev, classId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Classes</option>
                                {getUniqueValues('classId').map(id => {
                                    const cls = classes.find(c => c.id === id);
                                    return <option key={id} value={id}>{cls?.name || id}</option>;
                                })}
                            </select>
                        </div>

                        {/* Subject Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subject
                            </label>
                            <select
                                value={filters.subjectId}
                                onChange={(e) => setFilters(prev => ({ ...prev, subjectId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Subjects</option>
                                {getUniqueValues('subjectId').map(id => {
                                    const subj = subjects.find(s => s.id === id);
                                    return <option key={id} value={id}>{subj?.name || id}</option>;
                                })}
                            </select>
                        </div>

                        {/* Chapter Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Chapter
                            </label>
                            <select
                                value={filters.chapterId}
                                onChange={(e) => setFilters(prev => ({ ...prev, chapterId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Chapters</option>
                                {getUniqueValues('chapterId').map(id => {
                                    const chap = chapters.find(c => c.id === id);
                                    return <option key={id} value={id}>{chap?.name || id}</option>;
                                })}
                            </select>
                        </div>

                        {/* Concept Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Concept
                            </label>
                            <select
                                value={filters.conceptId}
                                onChange={(e) => setFilters(prev => ({ ...prev, conceptId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Concepts</option>
                                {getUniqueValues('conceptId').map(id => {
                                    const conc = concepts.find(c => c.id === id);
                                    return <option key={id} value={id}>{conc?.name || id}</option>;
                                })}
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Types</option>
                                {getUniqueValues('type').map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                {getUniqueValues('status').map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {filteredData.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-gray-400 text-lg mb-2">No questions found</div>
                        <p className="text-gray-500 text-sm">
                            {hasActiveFilters
                                ? "Try adjusting your filters"
                                : "No questions available"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.map((item, index) => {
                            const { concept, chapter, subject, classData } = getRelatedData(item);

                            return (
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
                                        {/* Hierarchy Info */}
                                        <div className="mb-3 pb-3 border-b border-gray-200">
                                            <div className="text-xs text-gray-600 space-y-1">
                                                {classData && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold">📚</span>
                                                        <span>{classData.name}</span>
                                                        {subject && <span className="text-gray-400">•</span>}
                                                        {subject && <span>{subject.name}</span>}
                                                    </div>
                                                )}
                                                {chapter && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold">📖</span>
                                                        <span className="truncate">{chapter.name}</span>
                                                    </div>
                                                )}
                                                {concept && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-semibold">💡</span>
                                                        <span className="truncate">{concept.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Question Details */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-900">
                                                Question #{data.indexOf(item) + 1}
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
                                                <span className="font-semibold text-blue-600">{item.type}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2">
                                                {new Date(item.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}