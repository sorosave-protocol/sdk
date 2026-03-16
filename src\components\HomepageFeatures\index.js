import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '⚡ Easy to Use',
    description: (
      <>
        SoroSave SDK provides a simple, intuitive API for interacting with
        SoroSave smart contracts on Stellar&apos;s Soroban platform. Get started
        in minutes with full TypeScript support.
      </>
    ),
  },
  {
    title: '⚛️ React Hooks',
    description: (
      <>
        Built-in React hooks make frontend integration seamless. Use{' '}
        <code>useGroup</code>, <code>useContribute</code>, and{' '}
        <code>useMemberGroups</code> to build powerful savings group UIs
        with minimal boilerplate.
      </>
    ),
  },
  {
    title: '🔒 Type Safe',
    description: (
      <>
        Full TypeScript support with generated types from the smart contract ABI.
        Catch errors at compile time and get excellent IDE autocomplete for all
        SDK methods and contract interactions.
      </>
    ),
  },
  {
    title: '🌐 Soroban Native',
    description: (
      <>
        Built specifically for Stellar&apos;s Soroban smart contract platform.
        Handles RPC communication, transaction signing, simulation, and
        submission transparently.
      </>
    ),
  },
  {
    title: '🔄 Auto-Generated Bindings',
    description: (
      <>
        Contract bindings are auto-generated from the on-chain contract ABI,
        ensuring your SDK is always in sync with the deployed smart contract
        without manual maintenance.
      </>
    ),
  },
  {
    title: '📦 Modular Architecture',
    description: (
      <>
        Import only what you need. The SDK is split into core client, React
        hooks, utility functions, and generated types — keeping your bundle
        size lean and your code organized.
      </>
    ),
  },
];

function Feature({ title, description }) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className="text--center padding-horiz--md padding-vert--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
