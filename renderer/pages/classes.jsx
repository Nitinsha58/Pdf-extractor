import { loadData } from "../data";
import { useEffect, useState } from "react";

export default function Classes() {
    const [data, setData] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            // Try to load from localStorage first
            const saved = localStorage.getItem('classes');
            if (saved) {
                setData(JSON.parse(saved));
            } else {
                // If no saved data, load from db
                const result = await loadData();
                setData(result.classes);
            }
        };
        fetchData();
    }, []);

    const handleAdd = () => {
        const newItem = {
            id: Date.now().toString(),
            name: "New Class",
            // Add other fields as needed
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
        if (confirm("Are you sure you want to delete this item?")) {
            setData(data.filter(item => item.id !== id));
            setHasChanges(true);
        }
    };

    const handleSaveToDb = () => {
        setIsSaving(true);
        try {
            localStorage.setItem('classes', JSON.stringify(data));
            setHasChanges(false);
            alert('Changes saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving changes: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!data) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Classes Management</h1>
                <div className="flex gap-3">
                    <button
                        onClick={handleAdd}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Add New Class
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Reset to original data from db/classes.json?')) {
                                localStorage.removeItem('classes');
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

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((item) => (
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
        </div>
    );
}