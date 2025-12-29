import { loadData } from "../data";
import { useEffect, useState } from "react";

export default function Concept() {
    const [data, setData] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [filterChapter, setFilterChapter] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const result = await loadData();

            // Load concepts
            const savedConcepts = localStorage.getItem('concept');
            if (savedConcepts) {
                setData(JSON.parse(savedConcepts));
            } else {
                setData(result.concept);
            }

            // Load chapters
            const savedChapters = localStorage.getItem('chapter');
            if (savedChapters) {
                setChapters(JSON.parse(savedChapters));
            } else {
                setChapters(result.chapter);
            }

            // Load classes
            const savedClasses = localStorage.getItem('classes');
            if (savedClasses) {
                setClasses(JSON.parse(savedClasses));
            } else {
                setClasses(result.classes);
            }

            // Load subjects
            const savedSubjects = localStorage.getItem('subject');
            if (savedSubjects) {
                setSubjects(JSON.parse(savedSubjects));
            } else {
                setSubjects(result.subject);
            }
        };
        fetchData();
    }, []);

    const handleAdd = () => {
        const newItem = {
            id: Date.now().toString(),
            name: "New Concept",
            chapterId: chapters[0]?.id || '',
        };
        setData([...data, newItem]);
        setHasChanges(true);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditForm({ ...item });
    };

    const handleSaveEdit = () => {
        setData(data.map(item =>
            item.id === editingId ? editForm : item
        ));
        setEditingId(null);
        setEditForm({});
        setHasChanges(true);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this concept?")) {
            setData(data.filter(item => item.id !== id));
            setHasChanges(true);
        }
    };

    const handleSaveToDb = () => {
        setIsSaving(true);
        try {
            localStorage.setItem('concept', JSON.stringify(data));
            setHasChanges(false);
            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving changes: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getChapterName = (chapterId) => {
        return chapters.find(c => c.id === chapterId)?.name || 'Unknown';
    };

    const getChapterDetails = (chapterId) => {
        const chapter = chapters.find(c => c.id === chapterId);
        if (!chapter) return { class: 'Unknown', subject: 'Unknown' };

        const className = classes.find(c => c.id === chapter.classId)?.name || 'Unknown';
        const subjectName = subjects.find(s => s.id === chapter.subjectId)?.name || 'Unknown';

        return { class: className, subject: subjectName };
    };

    const filteredChapters = chapters.filter(chapter => {
        const matchClass = !filterClass || chapter.classId === filterClass;
        const matchSubject = !filterSubject || chapter.subjectId === filterSubject;
        return matchClass && matchSubject;
    });

    const filteredData = data ? data.filter(item => {
        const matchChapter = !filterChapter || item.chapterId === filterChapter;

        // If filtering by class or subject, check if the concept's chapter matches
        if (filterClass || filterSubject) {
            const chapter = chapters.find(c => c.id === item.chapterId);
            if (!chapter) return false;

            const matchClass = !filterClass || chapter.classId === filterClass;
            const matchSubject = !filterSubject || chapter.subjectId === filterSubject;
            return matchChapter && matchClass && matchSubject;
        }

        return matchChapter;
    }) : [];

    if (!data || !chapters || !classes || !subjects) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Concepts Management</h1>
                <div className="flex gap-3">
                    <button
                        onClick={handleAdd}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add New Concept
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Reset to original data from db/concept.json?')) {
                                localStorage.removeItem('concept');
                                window.location.reload();
                            }
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSaveToDb}
                        disabled={!hasChanges || isSaving}
                        className={`px-6 py-2 rounded font-medium ${hasChanges && !isSaving
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {hasChanges && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                    You have unsaved changes
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow mb-4">
                <h3 className="font-semibold mb-3">Filters</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Class
                        </label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">All Classes</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Subject
                        </label>
                        <select
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(subj => (
                                <option key={subj.id} value={subj.id}>{subj.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Chapter
                        </label>
                        <select
                            value={filterChapter}
                            onChange={(e) => setFilterChapter(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="">All Chapters</option>
                            {filteredChapters.map(chap => (
                                <option key={chap.id} value={chap.id}>{chap.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chapter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((item) => {
                            const details = getChapterDetails(item.chapterId);
                            return (
                                <tr key={item.id}>
                                    {editingId === item.id ? (
                                        <>
                                            <td className="px-6 py-4 text-sm text-gray-500">{item.id}</td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={editForm.name || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="border rounded px-2 py-1 w-full"
                                                />
                                            </td>
                                            <td className="px-6 py-4" colSpan="3">
                                                <select
                                                    value={editForm.chapterId || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, chapterId: e.target.value })}
                                                    className="border rounded px-2 py-1 w-full"
                                                >
                                                    {chapters.map(chap => {
                                                        const chapDetails = getChapterDetails(chap.id);
                                                        return (
                                                            <option key={chap.id} value={chap.id}>
                                                                {chap.name} ({chapDetails.class} - {chapDetails.subject})
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 text-sm text-gray-500">{item.id}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                                    {getChapterName(item.chapterId)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                    {details.class}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                    {details.subject}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                Showing {filteredData.length} of {data.length} concepts
            </div>
        </div>
    );
}