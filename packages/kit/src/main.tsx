import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { ConnectButton, WalletProvider } from "./components";
import {
  useAccountBalance,
  useChain,
  useSuiClient,
  useWallet,
} from "./hooks";
import {
  ErrorCode,
  SuiChainId,
  formatSUI,
  defineSlushWallet,
  SuiTestnetChain,
  Uint8arrayTool,
  Chain,
} from "@nemoprotocol/wallet-sdk";
import { AllDefaultWallets } from "@nemoprotocol/wallet-sdk";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

const sampleNft = new Map([
  [
    "sui:devnet",
    "0xe146dbd6d33d7227700328a9421c58ed34546f998acdc42a1d05b4818b49faa2::nft::mint",
  ],
  [
    "sui:testnet",
    "0x5ea6aafe995ce6506f07335a40942024106a57f6311cb341239abf2c3ac7b82f::nft::mint",
  ],
  [
    "sui:mainnet",
    "0x5b45da03d42b064f5e051741b6fed3b29eb817c7923b83b92f37a1d2abf4fbab::nft::mint",
  ],
]);


function createMintNftTxb(contractAddress: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: contractAddress,
    arguments: [
      tx.pure.string("Suiet NFT"),
      tx.pure.string("Suiet Sample NFT"),
      tx.pure.string(
        "https://xc6fbqjny4wfkgukliockypoutzhcqwjmlw2gigombpp2ynufaxa.arweave.net/uLxQwS3HLFUailocJWHupPJxQsli7aMgzmBe_WG0KC4"
      ),
    ],
  });
  return tx;
}


function App() {
  const wallet = useWallet();
  const { balance } = useAccountBalance();
  const chain = useChain();
  const client = useSuiClient();

  const nftContractAddr = useMemo(() => {
    if (!wallet.chain) return "";
    return sampleNft.get(wallet.chain.id) ?? "";
  }, [wallet]);

  async function handleSignAndExecuteTransactionBlock(
    target: string | undefined
  ) {
    if (!target) return;
    try {
      const tx = createMintNftTxb(target);
      const resData = await wallet.signAndExecuteTransactionBlock({
        // @ts-ignore
        transactionBlock: tx,
        options: {
          showObjectChanges: true,
        },
      });
      console.log("executeMoveCall success", resData);
      alert("executeMoveCall succeeded (see response in the console)");
    } catch (e) {
      console.error("executeMoveCall failed", e);
      alert("executeMoveCall failed (see response in the console)");
    }
  }

  async function handleSignAndExecuteTransaction(
    target: string | undefined,
    opts?: {
      isCustomExecution?: boolean;
    }
  ) {
    if (!target) return;
    try {
      const tx = createMintNftTxb(target);

      if (!opts?.isCustomExecution) {
        const resData = await wallet.signAndExecuteTransaction({
          transaction: tx,
        });
        console.log("signAndExecuteTransaction success", resData);
      } else {
        const resData = await wallet.signAndExecuteTransaction(
          {
            transaction: tx,
          },
          {
            execute: async ({ bytes, signature }) => {
              const res = await client.executeTransactionBlock({
                transactionBlock: bytes,
                signature: signature,
                options: {
                  showRawEffects: true,
                  showObjectChanges: true,
                },
              });
              return res;
            },
          }
        );
        console.log("signAndExecuteTransaction success", resData);
      }

      alert("executeMoveCall succeeded (see response in the console)");
    } catch (e) {
      console.error("executeMoveCall failed", e);
      alert("executeMoveCall failed (see response in the console)");
    }
  }

  async function handleSignPersonalMessage() {
    if (!wallet.account) return;

    try {
      const msg = "Hello world!";
      const msgBytes = new TextEncoder().encode(msg);
      // Convert ReadonlyUint8Array to Uint8Array
      const msgUint8Array = new Uint8Array(msgBytes);
      
      const result = await wallet.signPersonalMessage({
        message: msgUint8Array,
      });
      const publickKey = new Uint8Array(wallet.account.publicKey);
      const isValid = await wallet.verifySignedMessage(
        result,
        publickKey
      );
      console.log("verify signedMessage", isValid);
      alert("signMessage succeeded (see response in the console)");
    } catch (e) {
      console.error("signMessage failed", e);
      alert("signMessage failed (see response in the console)");
    }
  }

  function getPublicKey() {
    // @ts-ignore
    return wallet.account?.publicKey.toString("hex");
  }

  const chainName = (chainId: string | undefined) => {
    switch (chainId) {
      case SuiChainId.MAIN_NET:
        return "Mainnet";
      case SuiChainId.TEST_NET:
        return "Testnet";
      case SuiChainId.DEV_NET:
        return "Devnet";
      default:
        return "Unknown";
    }
  };

  const handleSignTxnAndVerifySignature = async (contractAddress: string) => {
    const txn = createMintNftTxb(contractAddress);
    txn.setSender(wallet.account?.address as string);
    const signedTxn = await wallet.signTransaction({
      transaction: txn,
    });
    console.log(`Sign and verify txn:`)
    console.log('--wallet: ', wallet.adapter?.name)
    console.log('--account: ', wallet.account?.address)
    const publicKey = wallet.account?.publicKey;
    if (!publicKey) {
      console.error("no public key provided by wallet");
      return;
    }
    console.log("-- publicKey: ", publicKey);
    const pubKey = new Ed25519PublicKey(publicKey);
    console.log('-- signed txnBytes: ', signedTxn.bytes)
    console.log("-- signed signature: ", signedTxn.signature);
    const txnBytes = Uint8arrayTool.fromBase64(signedTxn.bytes);
    const isValid = await pubKey.verifyTransaction(txnBytes, signedTxn.signature);
    console.log("-- use pubKey to verify transaction: ", isValid);
  }

  // @ts-ignore
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ConnectButton
        style={{ marginTop: "16px" }}
        onConnectSuccess={(name) => {
          console.log("connect success: ", name);
        }}
        onConnectError={(err) => {
          if (err.code === ErrorCode.WALLET__CONNECT_ERROR__USER_REJECTED) {
            console.warn(
              "user rejected the connection to " + err.details?.wallet
            );
          } else {
            console.warn("unknown connect error: ", err);
          }
        }}
        onDisconnectSuccess={(name) => {
          console.log("disconnect success: ", name);
        }}
        onDisconnectError={(err) => {
          console.log("disconnect error: ", err);
        }}
      />

      {!wallet.connected ? (
        <p>Connect DApp with Suiet wallet from now!</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p>current wallet: {wallet.adapter?.name}</p>
            <p>
              wallet status:{" "}
              {wallet.connecting
                ? "connecting"
                : wallet.connected
                ? "connected"
                : "disconnected"}
            </p>
            <p>account address: {wallet.account?.address}</p>
            <p>account publicKey: {getPublicKey() || "not supported"}</p>
            <p>
              current chain: {wallet.chain?.name} (id: {wallet.chain?.id})
            </p>
            <p>
              SUI Balance: {formatSUI(balance ?? 0)} (id: {wallet.chain?.id})
            </p>
          </div>
          <div style={{ margin: "8px 0", display: "flex", gap: "8px" }}>
            {nftContractAddr && (
              <button
                onClick={() =>
                  handleSignAndExecuteTransactionBlock(nftContractAddr)
                }
              >
                Mint {chainName(wallet.chain?.id)} NFT
              </button>
            )}
            {nftContractAddr && (
              <button
                onClick={() =>
                  handleSignAndExecuteTransaction(nftContractAddr, {
                    isCustomExecution: true,
                  })
                }
              >
                Sign + Execute Transaction
              </button>
            )}
            <button onClick={handleSignPersonalMessage}>signMessage</button>
          </div>
          <div style={{ margin: "8px 0", display: "flex", gap: "8px" }}>
            {nftContractAddr && (
              <button
                onClick={() =>
                  handleSignAndExecuteTransactionBlock(nftContractAddr)
                }
              >
                Mint {chainName(wallet.chain?.id)} NFT
              </button>
            )}
            <button onClick={handleSignPersonalMessage}>signMessage</button>
            {nftContractAddr && (
              <button
                onClick={() =>
                  handleSignTxnAndVerifySignature(nftContractAddr)
                }
              >
                Sign Transaction + Verify Signature
                </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const slushWallet = defineSlushWallet({
  appName: "Suiet Wallet Kit",
});
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider
      defaultWallets={[...AllDefaultWallets, slushWallet]}
    >
      <App />
    </WalletProvider>
  </React.StrictMode>
);
