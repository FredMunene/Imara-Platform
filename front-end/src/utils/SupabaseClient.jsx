import seedIdeas from '../data/ideas.json';

const STORAGE_KEY = 'imara_ideas';

function loadIdeas() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  // seed on first load
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedIdeas));
  return seedIdeas;
}

function saveIdeas(ideas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

// stub — no Supabase client needed
export const supabase = null;

export const addIdea = async (formData, user) => {
  try {
    const ideas = loadIdeas();
    const newIdea = {
      id: String(Date.now()),
      title: formData.title,
      problemStatement: formData.problemStatement,
      projectDescription: formData.projectDescription,
      solution: formData.solution,
      image: formData.image || '',
      resources: formData.resources ? JSON.stringify(formData.resources) : null,
      needsprojectmanager: formData.needsProjectManager || false,
      timeline: formData.timeline,
      uid: user?.id || user?.address || 'anonymous',
    };
    ideas.push(newIdea);
    saveIdeas(ideas);
    return newIdea;
  } catch (err) {
    console.error('addIdea error:', err);
    return null;
  }
};

export const uploadImageToSupabase = async (image) => {
  // Convert to base64 data URL for local storage
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(image);
  });
};

export const displayIdeas = async () => {
  return loadIdeas();
};


