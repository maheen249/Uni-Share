// Roll number format: 23D21A05F4
// 23 = batch year (20xx), D2 = college code, 1A05 = dept code, F4 = class roll

const COLLEGE_CODE = 'D2'

// Department code mapping
const DEPARTMENTS = {
  '1A01': 'Civil',
  '1A02': 'EEE',
  '1A03': 'Mechanical',
  '1A04': 'ECE',
  '1A05': 'CSE',
  '1A12': 'IT',
  '1A28': 'CSM',
  '1A33': 'CSD',
  '1A67': 'AIML',
  '1A66': 'AIDS',
}

export function parseRollNumber(roll) {
  const upper = roll.toUpperCase().trim()

  // Basic format validation: 2 digits + D2 + alphanumeric
  const regex = /^(\d{2})(D2)([A-Z0-9]{3,4})([A-Z0-9]{2,3})$/
  const match = upper.match(regex)

  if (!match) return null

  const batchYear = 2000 + parseInt(match[1])
  const deptCode = match[3]
  const classRoll = match[4]

  // Find department name
  const department = DEPARTMENTS[deptCode] || deptCode

  return {
    rollNumber: upper,
    batchYear,
    deptCode,
    department,
    classRoll
  }
}

export function isValidRollNumber(roll) {
  return parseRollNumber(roll) !== null
}

// Convert roll number to internal email for Supabase Auth
export function rollToEmail(roll) {
  return `${roll.toUpperCase().trim()}@d2.edu.in`
}
