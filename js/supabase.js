const SUPABASE_URL = 'https://onevrczdmrjfupclmwgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZXZyY3pkbXJqZnVwY2xtd2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDA4OTgsImV4cCI6MjA5MjAxNjg5OH0.hs92vcRitu5QeJR6dSMcDLxWCS193ULm1yMchRR_psk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== CST TIMEZONE HELPERS ==========
// Iowa uses America/Chicago (CST/CDT - UTC-6 or UTC-5)

function getCSTOffset() {
    // Get current CST offset (handles DST automatically)
    const now = new Date();
    const cstString = now.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const cstDate = new Date(cstString);
    const offset = (now.getTime() - cstDate.getTime()) / (60 * 60 * 1000);
    return offset;
}

function localToCST(localDate) {
    // Convert local date to CST by adding the offset
    const offset = getCSTOffset();
    return new Date(localDate.getTime() + (offset * 60 * 60 * 1000));
}

function cstToUTC(cstDate) {
    // CST is UTC-6 (standard) or UTC-5 (DST)
    // So to convert CST to UTC, we ADD 6 or 5 hours
    const offset = getCSTOffset();
    return new Date(cstDate.getTime() - (offset * 60 * 60 * 1000));
}

function nowInCST() {
    const now = new Date();
    const cstString = now.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    return new Date(cstString);
}

function formatForDateTimeLocal(cstDate) {
    // Format CST date for datetime-local input (shows in browser local time)
    // We need to adjust so when user picks a time, it represents CST
    const pad = (n) => n.toString().padStart(2, '0');
    
    // Get CST components
    const cstString = cstDate.toLocaleString('en-US', { 
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    // Parse the CST string
    const [datePart, timePart] = cstString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatDisplayDate(utcDateString) {
    // Convert UTC from database to CST display
    const date = new Date(utcDateString);
    return date.toLocaleString('en-US', { 
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

// Convert datetime-local input (interpreted as local) to UTC for storage
// User enters time in CST, we store as UTC
function inputToUTC(dateString) {
    if (!dateString) return null;
    
    // Parse the input as if it's CST
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create date in CST
    const cstDate = new Date(year, month - 1, day, hour, minute);
    
    // Convert to UTC by adding CST offset
    const offset = getCSTOffset();
    const utcDate = new Date(cstDate.getTime() + (offset * 60 * 60 * 1000));
    
    return utcDate.toISOString();
}

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

// ========== UPDATED DROP HELPERS ==========
async function getDrops() {
    const now = new Date().toISOString(); // Server compares in UTC
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .lte('unlock_at', now)
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

// Get teasers - visible but not yet officially dropped
async function getTeasers() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .lte('teaser_at', now)
        .gt('unlock_at', now)
        .eq('is_visible', true)
        .order('unlock_at');
    
    if (error) console.error(error);
    return data || [];
}

// Check if a specific drop is in teaser phase
async function isTeaser(drop) {
    const now = new Date();
    const teaserAt = drop.teaser_at ? new Date(drop.teaser_at) : null;
    const unlockAt = drop.unlock_at ? new Date(drop.unlock_at) : null;
    
    if (!teaserAt || !unlockAt) return false;
    return now >= teaserAt && now < unlockAt;
}

// Check if drop is fully unlocked
async function isUnlocked(drop) {
    if (!drop.unlock_at) return false;
    return new Date() >= new Date(drop.unlock_at);
}

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

async function getAllDropsAdmin() {
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .order('sort_order');
    
    return data || [];
}

async function updateDrop(id, updates) {
    return await supabase
        .from('drops')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
}

async function createDrop(drop) {
    return await supabase
        .from('drops')
        .insert([drop]);
}

async function deleteDrop(id) {
    return await supabase
        .from('drops')
        .delete()
        .eq('id', id);
}

export { 
    supabase, signUp, signIn, signOut, 
    getDrops, getUpcomingDrops, getTeasers, isAdmin,
    getAllDropsAdmin, updateDrop, createDrop, deleteDrop,
    isTeaser, isUnlocked, nowInCST, formatForDateTimeLocal, 
    formatDisplayDate, inputToUTC
};