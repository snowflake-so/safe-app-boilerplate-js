import React, { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SnowflakeSafeWalletAdapter } from '@snowflake-so/wallet-adapter-snowflake';
import { clusterApiUrl } from '@solana/web3.js';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import './App.css';

require('@solana/wallet-adapter-react-ui/styles.css');

const connection = new Connection('https://api.mainnet-beta.solana.com');
const makeTxn = async (
  instructions,
  feePayer
) => {
  let transaction = new Transaction();
  instructions.forEach(instruction => transaction.add(instruction));
  const latestBlockhash = await connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = latestBlockhash.blockhash;
  transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
  transaction.feePayer = feePayer;

  return transaction;
};

export const instructions = [
  {
    programId: new PublicKey('ETwBdF9X2eABzmKmpT3ZFYyUtmve7UWWgzbERAyd4gAC'),
    data: Buffer.from('74b89fceb3e0b22a', 'hex'),
    keys: [
      {
        pubkey: new PublicKey('5jo4Lh2Z9FGQ87sDhUBwZjNZdL15MwdeT5WUXKfwFSZY'),
        isSigner: false,
        isWritable: false,
      },
    ],
  },
];

export const BodyContent = (props) => {
  const wallet = useWallet();
  const handleCreateProposal = async () => {
    const _transaction = await makeTxn(instructions, wallet.publicKey);
    const txId = await wallet.sendTransaction(
      _transaction,
      null,
      {
        name: 'Mock proposal',
      }
    );

    console.log(txId);
  };

  const handleSignTransaction = async () => {
    const _transaction = await makeTxn(instructions, wallet.publicKey);
    if (wallet.signTransaction) {
      const transaction = await wallet.signTransaction(_transaction);

      const txid = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true,
        preflightCommitment: 'confirmed',
      });

      console.log(txid);
      alert(`New transaction created ${txid}`);
    }
  };

  const handleSignMessage = async () => {
    if (wallet.signMessage) {
      const message = await wallet.signMessage(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));
      console.log(message);
    }
  };

  const handleSignAllTransactions = async () => {
    const _transaction = await makeTxn(instructions, wallet.publicKey);
    if (wallet.signAllTransactions) {
      const transactions = await wallet.signAllTransactions([
        _transaction,
        _transaction,
        _transaction,
      ]);

      console.log(transactions);
      for (const transaction of transactions) {
        const txid = await connection.sendRawTransaction(transaction.serialize(), {
          skipPreflight: true,
          preflightCommitment: 'confirmed',
        });
        console.log(txid);
        alert(`New transaction created ${txid}`);
      }
    }
  };

  return (
    <div className="App">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <WalletMultiButton />
        <div style={{ margin: '20px 0px' }}>Wallet public key: {wallet?.publicKey?.toString()}</div>
        <div>
          <button onClick={handleCreateProposal}>
            Create a mock proposal
          </button>
          <button onClick={handleSignTransaction}>
            Sign a transaction
          </button>
          <button onClick={handleSignMessage}>
            Sign a message
          </button>
          <button onClick={handleSignAllTransactions}>
            Sign all transactions
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppContext = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SnowflakeSafeWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <BodyContent/>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
