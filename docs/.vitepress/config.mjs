export default {
  title: 'SoroSave SDK',
  description: 'TypeScript SDK for SoroSave - Decentralized Group Savings Protocol on Soroban',
  base: '/sdk/',
  ignoreDeadLinks: true,
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Tutorial', link: '/tutorial/group-lifecycle' }
    ],
    sidebar: {
      '/guide/': [{
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Configuration', link: '/guide/configuration' }
        ]
      }],
      '/api/': [{
        text: 'API Reference',
        items: [
          { text: 'SoroSaveClient', link: '/api/client' },
          { text: 'Types', link: '/api/types' },
          { text: 'Utils', link: '/api/utils' }
        ]
      }],
      '/tutorial/': [{
        text: 'Tutorials',
        items: [
          { text: 'Group Lifecycle', link: '/tutorial/group-lifecycle' }
        ]
      }]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sorosave-protocol/sdk' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 SoroSave Protocol'
    }
  }
}
