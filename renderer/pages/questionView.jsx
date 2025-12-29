import { useState, useEffect, useMemo } from 'react';

function QuestionCard({ item, classes, subjects, chapters, concepts, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(item);

    const getRelatedData = () => {
        const concept = concepts.find(c => c.id === item.conceptId);
        const chapter = chapters.find(ch => ch.id === item.chapterId);
        const subject = subjects.find(s => s.id === item.subjectId);
        const classData = classes.find(cl => cl.id === item.classId);
        return { concept, chapter, subject, classData };
    };

    const { concept, chapter, subject, classData } = getRelatedData();

    const handleSave = () => {
        onUpdate(editData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData(item);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                    <h3 className="text-lg font-bold mb-4">Edit Question</h3>

                    <div className="space-y-3">
                        <img
                            src={item.filepath}
                            alt="Question"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                        />
                        {/* Class */}
                        <div>

                            <label className="block text-xs font-medium mb-1">Class</label>
                            <select
                                value={editData.classId}
                                onChange={(e) => setEditData({ ...editData, classId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            >
                                <option value="">Select Class</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Subject</label>
                            <select
                                value={editData.subjectId}
                                onChange={(e) => setEditData({ ...editData, subjectId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(subj => (
                                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Chapter */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Chapter</label>
                            <select
                                value={editData.chapterId}
                                onChange={(e) => setEditData({ ...editData, chapterId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            >
                                <option value="">Select Chapter</option>
                                {chapters.map(chap => (
                                    <option key={chap.id} value={chap.id}>{chap.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Concept */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Concept</label>
                            <select
                                value={editData.conceptId}
                                onChange={(e) => setEditData({ ...editData, conceptId: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            >
                                <option value="">Select Concept</option>
                                {concepts.map(conc => (
                                    <option key={conc.id} value={conc.id}>{conc.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Question Type */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Question Type</label>
                            <select
                                value={editData.questionType}
                                onChange={(e) => setEditData({ ...editData, questionType: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            >
                                <option value="MCQ">MCQ</option>
                                <option value="numerical">Numerical</option>
                                <option value="theory">Theory</option>
                                <option value="CASE">CASE</option>
                            </select>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Difficulty</label>
                            <select
                                value={editData.difficulty}
                                onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>

                        {/* Marks */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Marks</label>
                            <input
                                type="number"
                                min="1"
                                value={editData.marks}
                                onChange={(e) => setEditData({ ...editData, marks: parseInt(e.target.value) || 1 })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            />
                        </div>

                        {/* Usage */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Usage</label>
                            <select
                                value={editData.usage}
                                onChange={(e) => setEditData({ ...editData, usage: e.target.value })}
                                className="w-full px-2 py-1 text-sm border rounded"
                            >
                                <option value="HW">HW</option>
                                <option value="CW">CW</option>
                                <option value="exercise">Exercise</option>
                                <option value="test">Test</option>
                                <option value="compact">Compact</option>
                                <option value="smart">Smart</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Priority (0-5)</label>
                            <input
                                type="number"
                                min="0"
                                max="5"
                                value={editData.priority}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setEditData({ ...editData, priority: Math.min(5, Math.max(0, val)) });
                                }}
                                className="w-full px-2 py-1 text-sm border rounded"
                            />
                        </div>

                        {/* Checkboxes */}
                        <div className="flex gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editData.verified}
                                    onChange={(e) => setEditData({ ...editData, verified: e.target.checked })}
                                    className="mr-2"
                                />
                                <label className="text-xs font-medium">Verified</label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={editData.active}
                                    onChange={(e) => setEditData({ ...editData, active: e.target.checked })}
                                    className="mr-2"
                                />
                                <label className="text-xs font-medium">Active</label>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            {/* Image */}
            <div className="relative bg-gray-100 h-48">
                <img
                    src={item.filepath}
                    alt="Question"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                    {item.verified && (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                            ✓ Verified
                        </span>
                    )}
                    {!item.active && (
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                            Inactive
                        </span>
                    )}
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
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="font-semibold text-blue-600">{item.questionType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Difficulty:</span>
                        <span className={`font-semibold ${item.difficulty === 'easy' ? 'text-green-600' :
                            item.difficulty === 'medium' ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>{item.difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Marks:</span>
                        <span className="font-semibold">{item.marks}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Usage:</span>
                        <span className="font-semibold">{item.usage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Priority:</span>
                        <span className="font-semibold">{item.priority}/5</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Page:</span>
                        <span>{item.pageNo}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium"
                    >
                        ✏️ Edit
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-medium"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main QuestionView Component
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
        questionType: '',
        difficulty: '',
        usage: '',
        searchText: ''
    });

    // Load data from localStorage
    useEffect(() => {
        try {
            // Load metadata
            const storedMetadata = localStorage.getItem('imageMetadata');
            const metadata = storedMetadata ? JSON.parse(storedMetadata) : [];
            setData(metadata);

            // Load relation data
            const savedClasses = localStorage.getItem('classes');
            setClasses(savedClasses ? JSON.parse(savedClasses) : []);

            const savedSubjects = localStorage.getItem('subject');
            setSubjects(savedSubjects ? JSON.parse(savedSubjects) : []);

            const savedChapters = localStorage.getItem('chapter');
            setChapters(savedChapters ? JSON.parse(savedChapters) : []);

            const savedConcepts = localStorage.getItem('concept');
            setConcepts(savedConcepts ? JSON.parse(savedConcepts) : []);

            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, []);

    // Filter data based on active filters
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Filter by hierarchy
            if (filters.classId && item.classId !== filters.classId) return false;
            if (filters.subjectId && item.subjectId !== filters.subjectId) return false;
            if (filters.chapterId && item.chapterId !== filters.chapterId) return false;
            if (filters.conceptId && item.conceptId !== filters.conceptId) return false;

            // Filter by new attributes
            if (filters.questionType && item.questionType !== filters.questionType) return false;
            if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
            if (filters.usage && item.usage !== filters.usage) return false;

            // Search text filter
            if (filters.searchText) {
                const searchLower = filters.searchText.toLowerCase();
                const concept = concepts.find(c => c.id === item.conceptId);
                const chapter = chapters.find(ch => ch.id === item.chapterId);

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
    }, [data, filters, concepts, chapters]);

    // Get unique values for filter dropdowns
    const getUniqueValues = (field) => {
        const values = new Set();
        data.forEach(item => {
            if (item[field]) values.add(item[field]);
        });
        return Array.from(values);
    };

    const resetFilters = () => {
        setFilters({
            classId: '',
            subjectId: '',
            chapterId: '',
            conceptId: '',
            questionType: '',
            difficulty: '',
            usage: '',
            searchText: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(v => v !== '');

    const handleUpdate = (updatedItem) => {
        const updatedData = data.map(item =>
            item.id === updatedItem.id ? updatedItem : item
        );
        setData(updatedData);
        localStorage.setItem('imageMetadata', JSON.stringify(updatedData));
    };

    const handleDelete = (itemId) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        const updatedData = data.filter(item => item.id !== itemId);
        setData(updatedData);
        localStorage.setItem('imageMetadata', JSON.stringify(updatedData));
    };

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Concept</label>
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

                        {/* Question Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                            <select
                                value={filters.questionType}
                                onChange={(e) => setFilters(prev => ({ ...prev, questionType: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Types</option>
                                {getUniqueValues('questionType').map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Difficulty Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                            <select
                                value={filters.difficulty}
                                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Difficulties</option>
                                {getUniqueValues('difficulty').map(diff => (
                                    <option key={diff} value={diff}>{diff}</option>
                                ))}
                            </select>
                        </div>

                        {/* Usage Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Usage</label>
                            <select
                                value={filters.usage}
                                onChange={(e) => setFilters(prev => ({ ...prev, usage: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Usage</option>
                                {getUniqueValues('usage').map(usage => (
                                    <option key={usage} value={usage}>{usage}</option>
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
                        {filteredData.map((item) => (
                            <QuestionCard
                                key={item.id}
                                item={item}
                                classes={classes}
                                subjects={subjects}
                                chapters={chapters}
                                concepts={concepts}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}