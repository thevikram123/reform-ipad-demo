import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://dhchsufskqecoelrdhwa.supabase.co'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_G9MwIp8usNm-7povOkNLWg_fFqubU9L'

export const supabase = createClient(url, publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

const accessEmail = (accessId) => `${accessId.trim().toLowerCase()}@demo.reformapp.org`

export async function signInWithAccessId(accessId, password) {
  return supabase.auth.signInWithPassword({ email: accessEmail(accessId), password })
}

export async function registerAssessor({ accessId, displayName, password }) {
  return supabase.auth.signUp({
    email: accessEmail(accessId),
    password,
    options: { data: { access_id: accessId.trim(), display_name: displayName.trim() } },
  })
}

export async function getMyProfile(userId) {
  const { data, error } = await supabase
    .from('reform_profiles')
    .select('id, access_id, display_name, role')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

function fromRow(row) {
  return {
    ...(row.payload || {}),
    id: row.id,
    status: row.status,
    assessorId: row.assessor_id,
    assessorSubmittedAt: row.assessor_submitted_at ? Date.parse(row.assessor_submitted_at) : null,
    nodalSubmittedAt: row.nodal_submitted_at ? Date.parse(row.nodal_submitted_at) : null,
    homeSubmittedAt: row.home_submitted_at ? Date.parse(row.home_submitted_at) : null,
    nodalEntry: row.nodal_entry || row.final_scorecard || null,
    homeEntry: row.home_entry || null,
    finalDecision: row.final_decision || null,
    updatedAt: Date.parse(row.updated_at),
  }
}

const SELECT = 'id, assessor_id, status, payload, final_scorecard, nodal_entry, home_entry, final_decision, assessor_submitted_at, nodal_submitted_at, home_submitted_at, updated_at'

export async function listCloudSessions() {
  const { data, error } = await supabase
    .from('reform_assessments')
    .select(SELECT)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(fromRow)
}

let writeQueue = Promise.resolve()

async function performSave(session) {
  if (!session || session.status !== 'open') return session
  const row = {
    id: session.id,
    status: 'open',
    prisoner_id: session.profile?.prisonerId || null,
    prisoner_name: session.profile?.name || null,
    district: session.profile?.district || null,
    payload: session,
    tentative_scorecard: session.scorecard || {},
  }
  const { data, error } = await supabase
    .from('reform_assessments')
    .upsert(row)
    .select(SELECT)
    .single()
  if (error) throw error
  return fromRow(data)
}

export function saveCloudSession(session) {
  writeQueue = writeQueue.catch(() => null).then(() => performSave(session))
  return writeQueue
}

export async function submitCloudSession(id) {
  const { data, error } = await supabase.rpc('reform_submit_for_nodal', { p_assessment_id: id })
  if (error) throw error
  return fromRow(data)
}

export async function submitNodalCloudSession(id, nodalEntry) {
  const { data, error } = await supabase.rpc('reform_submit_nodal', {
    p_assessment_id: id,
    p_nodal_entry: nodalEntry,
  })
  if (error) throw error
  return fromRow(data)
}

export async function submitHomeCloudSession(id, homeEntry) {
  const { data, error } = await supabase.rpc('reform_submit_home', {
    p_assessment_id: id,
    p_home_entry: homeEntry,
  })
  if (error) throw error
  return fromRow(data)
}
