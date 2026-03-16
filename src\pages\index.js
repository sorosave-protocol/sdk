import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/guide/getting-started"
          >
            Get Started →
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/api/"
            style={{ marginLeft: '1rem' }}
          >
            API Reference
          </Link>
        </div>

        <div className={styles.installBox}>
          <code>npm install @sorosave/sdk</code>
        </div>
      </div>
    </header>
  );
}

function QuickStart() {
  return (
    <section className={styles.quickStart}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <h2>Quick Start</h2>
            <p>Get up and running with SoroSave SDK in under 5 minutes.</p>
            <pre className={styles.codeBlock}>
              <code>{`import { SoroSaveClient } from "@sorosave/sdk";

const client = new SoroSaveClient({
  rpcUrl: "https://soroban-testnet.stellar.org",
  contractId: "YOUR_CONTRACT_ID",
  networkPassphrase: "Test SDF Network ; September 2015",
});

// Create a savings group
const tx = await client.createGroup({
  admin: "G...",
  name: "My Savings Group",
  token: "TOKEN_ADDRESS",
  contributionAmount: 1000000n,
  cycleLength: 86400,
  maxMembers: 5,
}, sourcePublicKey);`}</code>
            </pre>
          </div>
          <div className="col col--6">
            <h2>React Integration</h2>
            <p>Built-in hooks for seamless React integration.</p>
            <pre className={styles.codeBlock}>
              <code>{`import { 
  SoroSaveProvider, 
  useGroup 
} from "@sorosave/react";

function App() {
  return (
    <SoroSaveProvider config={{ contractId: "..." }}>
      <GroupInfo groupId={1} />
    </SoroSaveProvider>
  );
}

function GroupInfo({ groupId }) {
  const { group, loading } = useGroup(groupId);
  if (loading) return <div>Loading...</div>;
  return <h2>{group.name}</h2>;
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Documentation`}
      description="TypeScript SDK for interacting with the SoroSave smart contracts on Soroban"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickStart />
      </main>
    </Layout>
  );
}
