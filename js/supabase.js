const SUPABASE_URL = 'https://onevrczdmrjfupclmwgf.supabase.co';
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZXZyY3pkbXJqZnVwY2xtd2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDA4OTgsImV4cCI6MjA5MjAxNjg5OH0.hs92vcRitu5QeJR6dSMcDLxWCS193ULm1yMchRR_psk

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth helpers
async function signUp(email, password) {
    return await supabase.auth.signUp({ email, password });
}

async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

async function signOut() {
    return await supabase.auth.signOut();
}

// Drop helpers
async function getDrops() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .lte('unlock_at', now)  // Only get unlocked items
        .eq('is_visible', true)
        .order('sort_order');
    
    if (error) console.error(error);
    return data || [];
}

async function getUpcomingDrops() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .gt('unlock_at', now)
        .eq('is_visible', true)
        .order('unlock_at', { ascending: true })
        .limit(1);
    
    return data?.[0] || null;
}

// Check if current user is admin
async function isAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
    
    return data?.is_admin || false;
}

// Admin: Get all drops (including locked)
async function getAllDropsAdmin() {
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .order('sort_order');
    
    return data || [];
}

// Admin: Update drop
async function updateDrop(id, updates) {
    return await supabase
        .from('drops')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
}

// Admin: Create drop
async function createDrop(drop) {
    return await supabase
        .from('drops')
        .insert([drop]);
}

// Admin: Delete drop
async function deleteDrop(id) {
    return await supabase
        .from('drops')
        .delete()
        .eq('id', id);
}

export { 
    supabaseClient as supabase, signUp, signIn, signOut, 
    getDrops, getUpcomingDrops, isAdmin,
    getAllDropsAdmin, updateDrop, createDrop, deleteDrop 
};