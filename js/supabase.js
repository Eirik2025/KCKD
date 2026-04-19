const SUPABASE_URL = 'https://onevrczdmrjfupclmwgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uZXZyY3pkbXJqZnVwY2xtd2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDA4OTgsImV4cCI6MjA5MjAxNjg5OH0.hs92vcRitu5QeJR6dSMcDLxWCS193ULm1yMchRR_psk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== CST TIMEZONE HELPERS ==========

function getCSTOffset() {
    const now = new Date();
    const cstString = now.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    const cstDate = new Date(cstString);
    return (now.getTime() - cstDate.getTime()) / (60 * 60 * 1000);
}

function nowInCST() {
    const cstString = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    return new Date(cstString);
}

function formatForDateTimeLocal(cstDate) {
    const pad = (n) => n.toString().padStart(2, '0');
    const cstString = cstDate.toLocaleString('en-US', { 
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const [datePart, timePart] = cstString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    return `${year}-${month}-${day}T${hour}:${minute}`;
}

function formatDisplayDate(utcDateString) {
    if (!utcDateString) return 'Not set';
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

function inputToUTC(dateString) {
    if (!dateString) return null;
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const cstDate = new Date(year, month - 1, day, hour, minute);
    const offset = getCSTOffset();
    return new Date(cstDate.getTime() + (offset * 60 * 60 * 1000)).toISOString();
}

// ========== AUTH HELPERS ==========

async function signUp(email, password) {
    return await supabase.auth.signUp({ email, password });
}

async function signIn(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

async function signOut() {
    return await supabase.auth.signOut();
}

async function isAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    return data?.is_admin || false;
}

// ========== DROP HELPERS ==========

async function getDrops(type = null) {
    const now = new Date().toISOString();
    let query = supabase
        .from('drops')
        .select('*')
        .lte('unlock_at', now)
        .eq('is_visible', true)
        .order('sort_order');
    
    if (type) query = query.eq('drop_type', type);
    
    const { data, error } = await query;
    if (error) console.error(error);
    return data || [];
}

async function getUpcomingDrops(type = null) {
    const now = new Date().toISOString();
    let query = supabase
        .from('drops')
        .select('*')
        .gt('unlock_at', now)
        .eq('is_visible', true)
        .order('unlock_at', { ascending: true });
    
    if (type) query = query.eq('drop_type', type);
    
    const { data, error } = await query;
    return data || [];
}

async function getTeasers(type = null) {
    const now = new Date().toISOString();
    let query = supabase
        .from('drops')
        .select('*')
        .lte('teaser_at', now)
        .gt('unlock_at', now)
        .eq('is_visible', true)
        .order('unlock_at');
    
    if (type) query = query.eq('drop_type', type);
    
    const { data, error } = await query;
    if (error) console.error(error);
    return data || [];
}

async function getAllDropsAdmin(type = null) {
    let query = supabase.from('drops').select('*').order('sort_order');
    if (type) query = query.eq('drop_type', type);
    const { data, error } = await query;
    return data || [];
}

async function updateDrop(id, updates) {
    return await supabase.from('drops').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
}

async function createDrop(drop) {
    return await supabase.from('drops').insert([drop]);
}

async function deleteDrop(id) {
    return await supabase.from('drops').delete().eq('id', id);
}

// ========== VAULT/CARDS HELPERS ==========

async function getVaultCards(factionId = null) {
    const now = new Date().toISOString();
    let query = supabase
        .from('drops')
        .select('*')
        .eq('drop_type', 'vault')
        .lte('unlock_at', now)
        .eq('is_visible', true)
        .order('sort_order');
    
    if (factionId) query = query.eq('faction_id', factionId);
    
    const { data, error } = await query;
    if (error) console.error(error);
    return data || [];
}

async function getVaultTeasers(factionId = null) {
    const now = new Date().toISOString();
    let query = supabase
        .from('drops')
        .select('*')
        .eq('drop_type', 'vault')
        .lte('teaser_at', now)
        .gt('unlock_at', now)
        .eq('is_visible', true)
        .order('sort_order');
    
    if (factionId) query = query.eq('faction_id', factionId);
    
    const { data, error } = await query;
    if (error) console.error(error);
    return data || [];
}

// ========== FACTIONS/SETS HELPERS ==========

async function getFactions() {
    const { data, error } = await supabase.from('faction_lore').select('*').order('name');
    if (error) console.error(error);
    return data || [];
}

async function getFaction(factionId) {
    const { data, error } = await supabase.from('faction_lore').select('*').eq('faction_id', factionId).single();
    if (error) console.error(error);
    return data;
}

async function updateFaction(factionId, updates) {
    return await supabase.from('faction_lore').update({ ...updates, updated_at: new Date().toISOString() }).eq('faction_id', factionId);
}

async function getFactionDrops(factionId) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .eq('faction_id', factionId)
        .eq('is_visible', true)
        .or(`unlock_at.lte.${now},teaser_at.lte.${now}`)
        .order('sort_order');
    
    if (error) console.error(error);
    return data || [];
}

// ========== WHISPERS HELPERS ==========

async function getWhispers() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .eq('drop_type', 'whisper')
        .lte('unlock_at', now)
        .eq('is_visible', true)
        .order('unlock_at', { ascending: false });
    
    if (error) console.error(error);
    return data || [];
}

async function getWhisperTeasers() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('drops')
        .select('*')
        .eq('drop_type', 'whisper')
        .lte('teaser_at', now)
        .gt('unlock_at', now)
        .eq('is_visible', true)
        .order('teaser_at', { ascending: false });
    
    if (error) console.error(error);
    return data || [];
}

// ========== STATUS CHECKERS ==========

function getDropStatus(drop) {
    const now = new Date();
    const teaserAt = drop.teaser_at ? new Date(drop.teaser_at) : null;
    const unlockAt = drop.unlock_at ? new Date(drop.unlock_at) : null;
    
    if (!drop.is_visible) return { text: 'HIDDEN', class: 'status-hidden', state: 'hidden' };
    if (unlockAt && now >= unlockAt) return { text: 'UNLOCKED', class: 'status-unlocked', state: 'unlocked' };
    if (teaserAt && now >= teaserAt) return { text: 'TEASER', class: 'status-teaser', state: 'teaser' };
    return { text: 'LOCKED', class: 'status-locked', state: 'locked' };
}

// ========== EXPORTS ==========

export { 
    supabase, signUp, signIn, signOut, isAdmin,
    getDrops, getUpcomingDrops, getTeasers, getAllDropsAdmin,
    updateDrop, createDrop, deleteDrop,
    getVaultCards, getVaultTeasers,
    getFactions, getFaction, updateFaction, getFactionDrops,
    getWhispers, getWhisperTeasers,
    getDropStatus, nowInCST, formatForDateTimeLocal, 
    formatDisplayDate, inputToUTC
};