**PROPOSED ACTION:**
Create a new GitHub Actions workflow to deploy the documentation site using Docusaurus.

**docs-site/README.md:**
```markdown
# Sorosave Protocol SDK Documentation

This documentation site is built using Docusaurus and hosted on GitHub Pages.

## Getting Started

To build the documentation site, run the following command:

```bash
yarn build
```

## Contributing

To contribute to the documentation, please submit a pull request with your changes.

## Search

You can search the documentation using the search bar at the top right corner of the page.
```

**.github/workflows/docs.yml:**
```yaml
name: Deploy Documentation

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Install dependencies
        run: |
          yarn install

      - name: Build documentation
        run: |
          yarn build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs-site/
```

**docs-site/docusaurus.config.js:**
```javascript
module.exports = {
  title: 'Sorosave Protocol SDK',
  tagline: 'Documentation for the Sorosave Protocol SDK',
  url: 'https://your-repo-name.github.io/sorosave-protocol-sdk',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'your-username', // Usually your GitHub org/user name.
  projectName: 'sorosave-protocol-sdk', // Usually your repo name.
  themeConfig: {
    navbar: {
      title: 'Sorosave Protocol SDK',
      logo: {
        alt: 'Sorosave Protocol SDK Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          href: 'https://github.com/your-username/sorosave-protocol-sdk',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/your-discord-invite',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/your-twitter-handle',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: 'blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/your-username/sorosave-protocol-sdk',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Sorosave Protocol SDK. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          // It is recommended to set document id as docs home page (`docs/` path).
          homePageId: 'docs',
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/your-username/sorosave-protocol-sdk/edit/main/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/your-username/sorosave-protocol-sdk/edit/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
```

**docs-site/sidebars.js:**
```javascript
module.exports = {
  docs: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started'],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api-reference'],
    },
  ],
};
```

**docs-site/getting-started.md:**
```markdown
# Getting Started

Welcome to the Sorosave Protocol SDK documentation!

## Installation

To install the SDK, run the following command:

```bash
yarn add @sorosave/protocol-sdk
```

## Usage

To use the SDK, import it in your project and follow the API documentation.

```javascript
import { SorosaveProtocol } from '@sorosave/protocol-sdk';

const protocol = new SorosaveProtocol();
```

## Contributing

To contribute to the SDK, please submit a pull request with your changes.
```

This solution sets up a new GitHub Actions workflow to deploy the documentation site using Docusaurus. It also creates a new `docs-site/` directory and updates the `README.md` file to reflect the new documentation site. The `docusaurus.config.js` file is updated to configure the documentation site, and the `sidebars.js` file is updated to define the sidebar structure. The `getting-started.md` file is updated to provide a getting started guide for users.