import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Home',
      items: [
        'index'
      ],
      collapsible: false
    },
    {
      type: 'category',
      label: 'Guide',
      items: [
        'guide/getting-started',
        'guide/installation',
        'guide/configuration'
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/index',
        'api/client',
        'api/types',
        'api/utils'
      ],
    },
    {
      type: 'category',
      label: 'Tutorials',
      items: [
        'tutorial/group-lifecycle'
      ],
    }
  ],
};

export default sidebars;