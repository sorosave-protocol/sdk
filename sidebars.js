/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guideSidebar: [
    {
      type: 'category',
      label: 'Guide',
      collapsed: false,
      items: [
        'guide/introduction',
        'guide/installation',
        'guide/getting-started',
        'guide/configuration',
      ],
    },
  ],
  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/index',
        'api/client',
        'api/types',
        'api/utils',
      ],
    },
  ],
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: false,
      items: [
        'tutorial/group-lifecycle',
      ],
    },
  ],
};

module.exports = sidebars;
