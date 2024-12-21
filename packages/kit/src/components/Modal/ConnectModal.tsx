import React, { useCallback, useEffect, useState } from "react";
import { BaseModal } from "./BaseModal";
import { Extendable } from "../../types/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { SvgArrowLeft, SvgClose } from "../Icon/SvgIcons";
import { useWallet } from "../../hooks";
import { isNonEmptyArray } from "../../utils";
import Icon from "../Icon";
import "./index.scss";
import { BaseError, IWallet, KitError } from "@nemoprotocol/wallet-sdk";

export type ConnectModalProps = Extendable & {
  open?: boolean;
  theme?: "dark" | "light";
  onOpenChange?: (open: boolean) => void;
  onConnectSuccess?: (walletName: string) => void;
  onConnectError?: (error: BaseError) => void;
};

type WalletItemProps = Extendable & {
  wallet: IWallet;
  onSelect?: (wallet: IWallet) => void;
};

const Header = () => {
  return (
    <div className={"wkit-dialog__header"}>
      <Dialog.Title className={"wkit-dialog__title"}>
        {"Connect Wallet"}
      </Dialog.Title>
      <Dialog.Close
        style={{ position: "absolute", right: "16px", top: "16px" }}
        className={"wkit-dialog__close"}
      >
        <SvgClose />
      </Dialog.Close>
    </div>
  );
};

const Footer = () => {
  return (
    <div className={"wkit-new-to-sui"}>
      <span className={"wkit-new-to-sui__text"}>
        By connecting the wallet, I confirm that I have read and accept the
        updated Terms of Use and Privacy Policy, I confirm that I am not based
        in a jurisdiction where such access would be prohibited or restricted in
        any manner.{" "}
      </span>
      {/* <a
        className={"wkit-new-to-sui__link"}
        href="https://suiet.app/docs/getting-started"
        target="_blank"
      >
        Learn More Here
      </a> */}
    </div>
  );
};

const WalletItem = (props: WalletItemProps) => {
  const { wallet } = props;
  const [icon, setIcon] = useState<string>("");

  useEffect(() => {
    if (!wallet.iconUrl) return;
    setIcon(wallet.iconUrl);
  }, [wallet.iconUrl]);

  return (
    <div
      className={"wkit-select-item"}
      key={wallet.name}
      onClick={() => {
        props.onSelect?.(wallet);
      }}
    >
      <Icon
        icon={icon}
        className={"wkit-select-item__icon"}
        elClassName={"wkit-select-item__icon"}
      />
      {wallet.label ?? wallet.name}
    </div>
  );
};

const WalletList = (props: {
  title: string;
  wallets: IWallet[];
  onSelect?: (wallet: IWallet) => void;
}) => {
  if (!isNonEmptyArray(props.wallets)) return null;
  return (
    <div className={"wkit-select__container"}>
      <div className={"wkit-select__title"}>{props.title}</div>
      <div className="wkit-select__content">
        {isNonEmptyArray(props.wallets) &&
          props.wallets.map((wallet) => {
            return (
              <WalletItem
                key={wallet.name}
                wallet={wallet}
                onSelect={props.onSelect}
              />
            );
          })}
      </div>
    </div>
  );
};

type InstallGuideProps = Extendable & {
  wallet: IWallet;
  onNavBack?: () => void;
};
const InstallGuide = (props: InstallGuideProps) => {
  const { wallet } = props;
  return (
    <section>
      <div className={"wkit-dialog__header"}>
        <div
          style={{ position: "absolute", left: "16px", top: "16px" }}
          className={"wkit-dialog__close"}
          onClick={props.onNavBack}
        >
          <SvgArrowLeft />
        </div>

        <Dialog.Title className={"wkit-dialog__title"}>
          Install Wallet
        </Dialog.Title>
      </div>
      <div className="wkit-install">
        <img
          className="wkit-install__logo"
          src={wallet.iconUrl}
          alt={`${wallet.name} logo`}
        />
        <h1 className="wkit-install__title">You haven’t install this wallet</h1>
        <p className="wkit-install__description">
          Install wallet via Chrome Extension Store
        </p>
        <button
          className="wkit-button wkit-install__button"
          onClick={() => {
            if (!wallet.downloadUrl?.browserExtension) {
              throw new KitError(
                `no downloadUrl config on this wallet: ${wallet.name}`
              );
            }
            window.open(wallet.downloadUrl.browserExtension, "_blank");
          }}
        >
          Get Wallet
        </button>
      </div>
    </section>
  );
};

type ConnectingProps = Extendable & {
  wallet: IWallet;
  onNavBack?: () => void;
};
const Connecting = (props: ConnectingProps) => {
  const { wallet } = props;
  return (
    <section>
      <div className={"wkit-dialog__header"}>
        <div
          style={{ position: "absolute", left: "16px", top: "16px" }}
          className={"wkit-dialog__close"}
          onClick={props.onNavBack}
        >
          <SvgArrowLeft />
        </div>

        <Dialog.Title className={"wkit-dialog__title"}>Connecting</Dialog.Title>
      </div>
      <div className="wkit-connecting">
        <img
          className="wkit-connecting__logo"
          src={wallet.iconUrl}
          alt={`logo of ${wallet.name}`}
        />
        <h1 className="wkit-connecting__title">Opening {wallet.name}</h1>
        <p className="wkit-connecting__description">
          Confirm connection in the extension
        </p>
      </div>
    </section>
  );
};

export const ConnectModal = (props: ConnectModalProps) => {
  const {
    allAvailableWallets,
    configuredWallets,
    detectedWallets,
    select,
    connecting,
  } = useWallet();

  console.log("configuredWallets", configuredWallets);
  console.log("detectedWallets", detectedWallets);

  const {
    theme,
    onConnectSuccess = () => {},
    onConnectError = (err) => {
      throw err;
    },
  } = props;

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const [activeWallet, setActiveWallet] = useState<IWallet | undefined>();

  const handleSelectWallet = useCallback(
    async (wallet: IWallet) => {
      setActiveWallet(wallet);
      if (wallet.installed) {
        try {
          await select(wallet.name);
        } catch (err) {
          onConnectError(err as BaseError);
          return;
        }
        onConnectSuccess(wallet.name);
      }
    },
    [select]
  );

  function renderBody() {
    if (activeWallet) {
      if (!activeWallet.installed) {
        return (
          <InstallGuide
            wallet={activeWallet}
            onNavBack={() => {
              setActiveWallet(undefined);
            }}
          />
        );
      }
      if (connecting) {
        return (
          <Connecting
            wallet={activeWallet}
            onNavBack={() => {
              setActiveWallet(undefined);
            }}
          />
        );
      }
    }
    return (
      <div>
        <Header />
        <div className="wkit-select__scroll">
          <WalletList
            title={"Popular"}
            wallets={configuredWallets}
            onSelect={handleSelectWallet}
          />
          <WalletList
            title={"Others"}
            wallets={detectedWallets}
            onSelect={handleSelectWallet}
          />
        </div>
        <div style={{ height: "41px", flexShrink: "0" }}></div>
        <Footer />
      </div>
    );
  }

  // 添加移动端检测
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <BaseModal
      open={props.open}
      onOpenChange={props.onOpenChange}
      trigger={props.children}
      contentProps={{
        onOpenAutoFocus: (e: Event) => {
          e.preventDefault();
        },
        style: isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          transform: 'none',
        } : undefined
      }}
    >
      {renderBody()}
    </BaseModal>
  );
};

export default ConnectModal;
