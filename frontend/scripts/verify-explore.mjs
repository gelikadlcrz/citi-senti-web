/** No-dependency checks for the Explore feature's content and navigation. */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const project = resolve(root, '..')
const read = (relative) => readFileSync(join(root, relative), 'utf8')
const categorySource = read('src/data/aspects.ts')
const seedSource = readFileSync(join(project, 'supabase/migrations/20261124124934_seed_reference_data.sql'), 'utf8')
const pathsSource = read('src/components/Sidebar.tsx')
const appSource = read('src/App.tsx')
const iconSprite = read('public/iconify-lucide.svg')

const canonical = [...seedSource.matchAll(/\('A(\d{2})', '([^']+)'/g)].map((match) => `A${match[1]}:${match[2]}`)
const displayed = [...categorySource.matchAll(/code: '(A\d{2})',\s*name: '([^']+)'/g)].map((match) => `${match[1]}:${match[2]}`)
const requireTrue = (condition, label) => {
  if (!condition) { console.error(`FAIL: ${label}`); process.exitCode = 1 }
  else console.log(`PASS: ${label}`)
}
requireTrue(canonical.length === 11, 'Supabase seed includes 11 aspect categories')
requireTrue(JSON.stringify(canonical) === JSON.stringify(displayed), 'Explore taxonomy matches database seed codes and names in order')
requireTrue(displayed.includes('A09:Environmental Impact'), 'A09 Environmental Impact is included')
requireTrue(pathsSource.includes("aspects: '/explore/aspects'") && pathsSource.includes("workflow: '/explore/how-it-works'") && pathsSource.includes("about: '/explore/about'"), 'All three Explore routes are declared')
requireTrue(['paths.aspects', 'paths.workflow', 'paths.about'].every((p) => appSource.includes(p)), 'All three pages are routed')
requireTrue(/localStorage\.setItem/.test(pathsSource) && /aria-expanded/.test(pathsSource), 'Sidebar collapse state and accessible control are implemented')
const icons = [...new Set([...read('src/components/Sidebar.tsx').matchAll(/lucide:([\w-]+)/g), ...read('src/pages/HowItWorksPage.tsx').matchAll(/lucide:([\w-]+)/g), ...read('src/pages/AboutPage.tsx').matchAll(/lucide:([\w-]+)/g), ...read('src/pages/AspectCategoriesPage.tsx').matchAll(/lucide:([\w-]+)/g)].map((match) => match[1]))]
requireTrue(icons.every((i) => iconSprite.includes(`id="${i}"`)), 'All used Iconify Lucide identifiers have bundled symbols')
