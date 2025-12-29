import { loadData } from "../data";
import { useEffect, useState } from "react";

export default function Chapter() {
    const [data, setData] = useState(null);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [filterClass, setFilterClass] = useState('');
    const [filterSubject, setFilterSubject] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const result = await loadData();

            // Load chapters
            const savedChapters = localStorage.getItem('chapter');
            if (savedChapters) {
                setData(JSON.parse(savedChapters));
            } else {
                setData(result.chapter);
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
            name: "New Chapter",
            classId: classes[0]?.id || '',
            subjectId: subjects[0]?.id || '',
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
        if (confirm("Are you sure you want to delete this chapter?")) {
            setData(data.filter(item => item.id !== id));
            setHasChanges(true);
        }
    };

    const handleSaveToDb = () => {
        setIsSaving(true);
        try {
            localStorage.setItem('chapter', JSON.stringify(data));
            setHasChanges(false);
            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving changes: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const getClassName = (classId) => {
        return classes.find(c => c.id === classId)?.name || 'Unknown';
    };

    const getSubjectName = (subjectId) => {
        return subjects.find(s => s.id === subjectId)?.name || 'Unknown';
    };

    const filteredData = data ? data.filter(item => {
        const matchClass = !filterClass || item.classId === filterClass;
        const matchSubject = !filterSubject || item.subjectId === filterSubject;
        return matchClass && matchSubject;
    }) : [];

    if (!data || !classes || !subjects) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Chapters Management</h1>
                <div className="flex gap-3">
                    <button
                        onClick={handleAdd}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add New Chapter
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Reset to original data from db/chapter.json?')) {
                                localStorage.removeItem('chapter');
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
                <div className="flex gap-4">
                    <div className="flex-1">
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
                    <div className="flex-1">
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
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.map((item) => (
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
                                        <td className="px-6 py-4">
                                            <select
                                                value={editForm.classId || ''}
                                                onChange={(e) => setEditForm({ ...editForm, classId: e.target.value })}
                                                className="border rounded px-2 py-1 w-full"
                                            >
                                                {classes.map(cls => (
                                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={editForm.subjectId || ''}
                                                onChange={(e) => setEditForm({ ...editForm, subjectId: e.target.value })}
                                                className="border rounded px-2 py-1 w-full"
                                            >
                                                {subjects.map(subj => (
                                                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                                                ))}
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
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                {getClassName(item.classId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                                {getSubjectName(item.subjectId)}
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
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                Showing {filteredData.length} of {data.length} chapters
            </div>
        </div>
    );
}