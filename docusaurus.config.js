// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'SoroSave SDK',
  tagline: 'TypeScript SDK for interacting with the SoroSave smart contracts on Soroban',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://sorosave-protocol.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/sdk/',

  // GitHub pages deployment config
  organizationName: 'sorosave-protocol',
  projectName: 'sdk',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          editUrl:
            'https://github.com/sorosave-protocol/sdk/edit/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Social card image
      image: 'img/sorosave-social-card.png',
      navbar: {
        title: 'SoroSave SDK',
        logo: {
          alt: 'SoroSave Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'guideSidebar',
            position: 'left',
            label: 'Guide',
          },
          {
            type: 'docSidebar',
            sidebarId: 'apiSidebar',
            position: 'left',
            label: 'API Reference',
          },
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Tutorials',
          },
          {
            href: 'https://github.com/sorosave-protocol/sdk',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/guide/getting-started',
              },
              {
                label: 'API Reference',
                to: '/api/',
              },
              {
                label: 'Tutorials',
                to: '/tutorial/group-lifecycle',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub Issues',
                href: 'https://github.com/sorosave-protocol/sdk/issues',
              },
              {
                label: 'Contributing',
                href: 'https://github.com/sorosave-protocol/sdk/blob/main/CONTRIBUTING.md',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/sorosave-protocol/sdk',
              },
              {
                label: 'NPM Package',
                href: 'https://www.npmjs.com/package/@sorosave/sdk',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} SoroSave Protocol. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
        additionalLanguages: ['bash', 'typescript', 'rust', 'json'],
      },
      algolia: {
        // Algolia DocSearch config - replace with real credentials when available
        // See: https://docusaurus.io/docs/search
        appId: 'YOUR_APP_ID',
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'sorosave-sdk',
        contextualSearch: true,
        searchPagePath: 'search',
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      announcementBar: {
        id: 'announcement',
        content:
          '⭐ If you find SoroSave useful, please give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/sorosave-protocol/sdk">GitHub</a>!',
        backgroundColor: '#20232a',
        textColor: '#fff',
        isCloseable: true,
      },
    }),

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: '/',
      },
    ],
  ],
};

module.exports = config;
