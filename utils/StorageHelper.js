const STORAGE_KEY = "petaid_guides";

function loadGuides() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    return parsed.map(guideData => FirstAidGuide.fromJSON(guideData));
}

function saveGuides(guides) {
    const data = guides.map(guide => guide.toJSON());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getGuidesByCategory(category) {
    const guides = loadGuides();
    return guides.filter(guide => guide.getCategory() === category);
}

function getGuideById(id) {
    const guides = loadGuides();
    return guides.find(guide => guide.getId() === id) || null;
}