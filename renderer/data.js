export async function loadData() {
    const files = ["chapter", "classes", "concept", "metadata", "subject"];

    const data = {};

    await Promise.all(
        files.map(async (f) => {
            const res = await fetch(`/db/${f}.json`);
            data[f] = await res.json();
        })
    );

    return data;
}