import type { Build, Manifest } from './types'

const MANIFEST_URL = `${import.meta.env.BASE_URL}configs/manifest.json`

function escapeHtml(str: string): string {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}

function buildConfigUrl(file: string): string {
  return new URL(`${import.meta.env.BASE_URL}configs/${file}`, window.location.origin).href
}

function getAppUrl(build: Build, baseUrl: string): string {
  // Full override takes priority
  if (build.appUrl) return build.appUrl.replace(/\/$/, '')
  // Otherwise combine baseUrl + path
  return `${baseUrl.replace(/\/$/, '')}/${build.path ?? build.app}`
}

function getFileLabel(file: string): string {
  const ext = file.split('.').pop() ?? ''
  return ext ? ext.toUpperCase() : 'FILE'
}

function renderCard(build: Build, baseUrl: string): string {
  const configUrl = buildConfigUrl(build.file)
  const appUrl = getAppUrl(build, baseUrl)
  const editUrl = `${appUrl}/?url=${encodeURIComponent(configUrl)}`
  const fileLabel = getFileLabel(build.file)

  return `
    <div class="card" data-edit-url="${editUrl}">
      <div class="card-header">
        <span class="card-title">${escapeHtml(build.name)}</span>
        <span class="card-app">${escapeHtml(build.app)}</span>
      </div>
      <div class="card-description">${escapeHtml(build.description)}</div>
      <div class="card-footer">
        <span class="card-date">Updated ${escapeHtml(build.updated)}</span>
        <div class="card-actions">
          <a class="btn" href="${configUrl}" target="_blank">${escapeHtml(fileLabel)}</a>
          <a class="btn btn-primary" href="${editUrl}" target="_blank">Open</a>
        </div>
      </div>
    </div>
  `
}

type Theme = 'light' | 'dark'

const THEME_KEY = 'builds-theme'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  const toggle = document.getElementById('theme-toggle')
  if (toggle) {
    toggle.textContent = theme === 'dark' ? '☀' : '☾'
    toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`)
  }
}

function initThemeToggle(): void {
  let theme = getInitialTheme()
  applyTheme(theme)
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
  })
}

async function loadManifest(): Promise<void> {
  const content = document.getElementById('content')!

  try {
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const manifest: Manifest = await res.json()
    const { baseUrl, builds } = manifest

    if (!builds.length) {
      content.innerHTML =
        '<div class="empty"><h3>No builds yet</h3><p>Add a JSON config to public/configs/ and update manifest.json</p></div>'
      return
    }

    content.className = 'grid'
    content.innerHTML = builds.map((b) => renderCard(b, baseUrl)).join('')

    // Card click handler (delegate)
    content.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.closest('.card-actions')) return
      const card = target.closest<HTMLElement>('.card')
      if (card?.dataset.editUrl) {
        window.open(card.dataset.editUrl, '_blank')
      }
    })
  } catch (e) {
    content.innerHTML = `<div class="empty"><h3>Failed to load</h3><p>${escapeHtml((e as Error).message)}</p></div>`
  }
}

initThemeToggle()
loadManifest()
