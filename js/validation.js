// Supports conventional codes (CS101) and year-first project codes (25CS2304).
export const SUBJECT_CODE = /^(?:[A-Z]{2,5}\d{2,4}|\d{2}[A-Z]{2,5}\d{3,4})$/;
export function normalizeSubjects(value) {
  return String(value).trim().split(/[\s,;|]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
}
export function validateRegistrationRows(rows) {
  const errors = [], normalized = [], seen = new Set();
  for (let index=0; index<rows.length; index++) {
    const row = rows[index], line = row.line ?? index + 1;
    const studentId = String(row.studentId ?? '').trim();
    const subjects = Array.isArray(row.subjects) ? row.subjects.map(s => String(s).trim().toUpperCase()).filter(Boolean) : normalizeSubjects(row.subjects ?? '');
    if (!studentId) errors.push(`Row ${line}: student ID is missing.`);
    if (!subjects.length) errors.push(`Row ${line}: at least one subject code is required.`);
    for (const subject of subjects) if (!SUBJECT_CODE.test(subject)) errors.push(`Row ${line}: invalid subject code “${subject}”. Use 2–5 letters followed by 2–4 digits, or 2 digits + 2–5 letters + 3–4 digits.`);
    if (new Set(subjects).size !== subjects.length) errors.push(`Row ${line}: duplicate subject codes are not allowed for ${studentId || 'this student'}.`);
    for (const subject of subjects) {
      const key = `${studentId.toUpperCase()}\u0000${subject}`;
      if (seen.has(key)) errors.push(`Row ${line}: duplicate registration — ${studentId} is registered for ${subject} more than once.`);
      seen.add(key);
    }
    if (studentId && subjects.length) normalized.push({ studentId, subjects: [...new Set(subjects)] });
  }
  return { valid: errors.length === 0, errors, registrations: normalized };
}

// CSV parser supporting quoted commas and escaped double quotes.
export function parseCSV(text) {
  const rows=[]; let row=[], cell='', quoted=false;
  for (let i=0;i<text.length;i++) {
    const ch=text[i];
    if (quoted && ch==='"' && text[i+1]==='"') { cell+='"'; i++; }
    else if (ch==='"') quoted=!quoted;
    else if (ch===',' && !quoted) { row.push(cell); cell=''; }
    else if ((ch==='\n'||ch==='\r') && !quoted) { if (ch==='\r'&&text[i+1]==='\n') i++; row.push(cell); if(row.some(v=>v.trim())) rows.push(row); row=[]; cell=''; }
    else cell+=ch;
  }
  row.push(cell); if(row.some(v=>v.trim())) rows.push(row);
  if (!rows.length) return { rows:[], errors:['CSV file is empty.'] };
  const headers=rows.shift().map(v=>v.trim().toLowerCase().replace(/[\s-]+/g,'_'));
  const idIndex=headers.findIndex(v=>['student_id','student','id','registration_no'].includes(v));
  const subIndex=headers.findIndex(v=>['subject_codes','subjects','courses','course_codes'].includes(v));
  if (idIndex<0||subIndex<0) return { rows:[], errors:['CSV must include student_id and subject_codes columns.'] };
  return { rows:rows.map((r,i)=>({studentId:r[idIndex]||'',subjects:r[subIndex]||'',line:i+2})), errors:[] };
}
