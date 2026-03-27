import { execSync } from 'child_process'

const VERCEL_ENV = process.env.VERCEL_ENV
const VERCEL_GIT_COMMIT_REF = process.env.VERCEL_GIT_COMMIT_REF

console.log(`VERCEL_ENV: ${VERCEL_ENV}`)
console.log(`VERCEL_GIT_COMMIT_REF: ${VERCEL_GIT_COMMIT_REF}`)

const isChanged = () => {
  try {
    execSync('git fetch origin main')
    execSync('git diff --quiet origin/main...HEAD -- packages/webapp')
    return false
  } catch {
    return true
  }
}

try {
  if (VERCEL_ENV === 'production' && isChanged()) {
    process.exit(1)
  } else if (VERCEL_GIT_COMMIT_REF === 'staging') {
    process.exit(1)
  } else {
    process.exit(0)
  }
} catch (error) {
  console.log('VERCEL ERROR:', error)
  process.exit(0)
}
