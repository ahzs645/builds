export interface Build {
  id: string
  name: string
  description: string
  file: string
  app: string
  /** Subpath under baseUrl (e.g. "rack-configurator") */
  path?: string
  /** Full override URL — use when the project isn't under the default baseUrl */
  appUrl?: string
  updated: string
}

export interface Manifest {
  /** Default root for all projects (e.g. "https://projects.ahmadjalil.com") */
  baseUrl: string
  builds: Build[]
}
