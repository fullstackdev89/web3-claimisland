import * as React from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BigNumber from "bignumber.js";
import { connect } from "redux-zero/react";
import { actions, store } from "store/redux";

import Web3 from "web3";
import Web3Modal, { connectors } from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useAsync } from "react-use";

import { ClamIslandChain, gemTokenAddress, shellTokenAddress, BUSD } from "constants/constants";
import { getUsdPriceOfToken } from "web3/pancakeRouter";

import Navbar from "components/Navbar";
import { color, periodInSeconds, periodStart, shape } from "../web3/pearlBurner";
import { getClamValueInShellToken, getPearlValueInShellToken } from "../web3/clam";

import clamIcon from "assets/clam-icon.png";
import open from "assets/m-open.png";
import close from "assets/m-close.png";


import _ from "lodash";
import ROUTES from "../router";

let web3;

const IMG_LOC = "/nav_icons/";

const web3Modal = new Web3Modal({
  network: "binance",
  cacheProvider: true, // maybe use true on production
  providerOptions: {
    // injected: {
    //   display: {
    //     name: "Injected",
    //     description: "Home-BrowserWallet",
    //   },
    // },
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "27e484dcd9e3efcfd25a83a78777cdf1", // required
        rpc: {
          56: "https://bsc-dataseed.binance.org/",
        },
        network: "binance",
        chainId: 56,
      },
      // options: {
      //   infuraId: "27e484dcd9e3efcfd25a83a78777cdf1", // required
      //   rpc: {
      //     97: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      //   },
      //   network: "binance",
      //   chainId: 97,
      // },
    },
    "custom-twt": {
      display: {
        name: "Trust",
        description: "Trust Wallet",
        logo: "https://trustwallet.com/assets/images/favicon.png",
      },
      package: "twt",
      connector: connectors.injected,
    },
    "custom-binance": {
      display: {
        name: "Binance",
        description: "Binance Chain Wallet",
        logo: "https://zeroheight-uploads.s3-accelerate.amazonaws.com/10130f38006eb6d73d4bb2?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAJXTVUC4XZENV3LPQ%2F20211105%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20211105T140330Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=20a675ead3a7d80efacbfc5c7f8120c45037550fa6f9793280d7790c4add8af3",
      },
      package: "binance",
      connector: async (ProviderPackage, options) => {
        const provider = window.BinanceChain;
        await provider.enable();
        return provider;
      },
    },
  },
});

export function useWeb3Modal({
  resetAccount,
  updateAccount,
  updatePrice,
  updateUI,
  dispatchFetchAccountAssets,
  updateBoostParams,
}) {
  const [activeAddress, setActiveAddress] = useState();

  function initWeb3(provider) {
    const web3 = new Web3(provider);

    web3.eth.extend({
      methods: [
        {
          name: "chainId",
          call: "eth_chainId",
          outputFormatter: web3.utils.hexToNumber,
        },
      ],
    });

    return web3;
  }

  useEffect(() => {
    const getItinData = async () => {
      if (updatePrice) {
        const [gemPrice, shellPrice] = (
          await Promise.all([
            getUsdPriceOfToken(gemTokenAddress, BUSD),
            getUsdPriceOfToken(shellTokenAddress, BUSD),
          ])
        ).map((price) => new BigNumber(price).toFixed(2));
        updatePrice({ gem: gemPrice, shell: shellPrice });
      }

      if (updateBoostParams) {
        const [
          boostColor,
          boostShape,
          boostPeriodStart,
          boostPeriodInSeconds,
          clamValueInShellToken,
          pearlValueInShellToken,
        ] = await Promise.all([
          color(),
          shape(),
          periodStart(),
          periodInSeconds(),
          getClamValueInShellToken(),
          getPearlValueInShellToken(),
        ]);

        updateBoostParams({
          boostColor,
          boostShape,
          boostPeriodStart,
          boostPeriodInSeconds,
          clamValueInShellToken,
          pearlValueInShellToken,
        });
      }
    };

    getItinData();
  }, []);

  const isBinanceChain = (chainId) =>
    [ClamIslandChain.BSC, ClamIslandChain.Localhost, ClamIslandChain.BSC_TESTNET].includes(chainId);

  const getAccountAssets = async () => {
    console.log("getAccountAssets");
    const {
      account: { isBSChain },
    } = store.getState();

    updateUI({ isFetching: true });
    try {
      if (isBSChain) {
        const [gemPrice, shellPrice] = (
          await Promise.all([
            getUsdPriceOfToken(gemTokenAddress, BUSD),
            getUsdPriceOfToken(shellTokenAddress, BUSD),
          ])
        ).map((price) => new BigNumber(price).toFixed(2));
        updatePrice({ gem: gemPrice, shell: shellPrice });

        await dispatchFetchAccountAssets();

        updateUI({ isFetching: false });
      } else {
        updateUI({ isFetching: false });
      }
    } catch (error) {
      console.error("web3providerModal", { error });
      updateUI({ isFetching: false });
    }
  };

  async function onConnect() {
    console.log("onConnect");

    const provider = await web3Modal.connect();
    await subscribeProvider(provider);
    web3 = initWeb3(provider);
    const [address] = await web3.eth.getAccounts();
    const chainId = await web3.eth.getChainId();
    const isBSChain = isBinanceChain(chainId);

    console.log({
      chainId,
      provider,
      address,
    });

    await updateAccount({
      // error: isBSChain ? null : activateError,
      address,
      isConnected: !!address,
      isBSChain,
      chainId,
      reason: "onConnect",
    });

    setActiveAddress(address);

    // get balances and nfts
    await getAccountAssets();
  }

  const subscribeProvider = async (provider) => {
    if (!provider.on) {
      return;
    }
    provider.on("close", () => {
      console.log("close");
      onDisconnect();
    });

    provider.on("accountsChanged", async (accounts) => {
      console.log("accountsChanged");
      updateAccount({ address: accounts[0], reason: "accountsChanged" });
      // get balance and nfts from account
      await getAccountAssets();
    });

    provider.on("chainChanged", async (chainId) => {
      const netId = parseInt(chainId);
      console.log("chainChanged", { netId });

      const isBSChain = isBinanceChain(netId);

      updateAccount({
        isBSChain,
        chainId: netId,
        reason: "chainChanged",
      });

      // get balance and nfts from account on new network
      await getAccountAssets();
    });
  };

  async function onDisconnect() {
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close();
    }
    web3Modal.clearCachedProvider();

    resetAccount();
    setActiveAddress(undefined);
  }

  return { activeAddress, web3Modal, onConnect, onDisconnect };
}

const Web3ProvidersModal = ({
  account: { address },
  resetAccount,
  updateAccount,
  updatePrice,
  updateUI,
  dispatchFetchAccountAssets,
}) => {

  const NAV_ROUTES = _.chain(ROUTES)
  .filter((k) => k.icon)
  .sortBy((k) => k.order)
  .map(({ title, icon, url }) => ({ title, icon, url }))
  .value();

  console.log("NAV_ROUTES1", NAV_ROUTES);

  const { onConnect, onDisconnect } = useWeb3Modal({
    resetAccount,
    updateAccount,
    updatePrice,
    updateUI,
    dispatchFetchAccountAssets,
  });
  const [mStatus, setMStatus] = useState(false);

  useAsync(async () => {
    console.log("on init check for web3");
    // only auto connect if web3modal has been selected and wallet is unlocked
    if (window.ethereum.selectedAddress && web3Modal.cachedProvider) {
      onConnect();
    }
  });

  const toggle = () => {
    setMStatus(!mStatus);
  }

  const icons = NAV_ROUTES.map((k, i) => {
    return (
      <div key={i}>
        <Link to={k.url}>
          {k.title}
        </Link>
      </div>
    );
  });

  return (
    <>
      {/* {address ? (
        <Navbar onDisconnect={onDisconnect} />
      ) : ( */}
      <>
        <nav className="mNavbar flex min-h-48 min-w-full justify-end fixed px-6 py-4 bg-transparent z-20">
          <div className="w-full lg:flex lg:items-center lg:w-auto lg:px-3 px-8 web3providermodal">
            {address ? (
              <Navbar onDisconnect={onDisconnect} />
            ) : (
              <div className="flex">
                <button
                  type="button"
                  className="focus:outline-none block text-md px-4 ml-2 py-2 rounded-xl bg-gray-800 text-white font-bold hover:text-white hover:bg-gray-700"
                  onClick={onConnect}
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>

          <div className="hidden mNavbarItems w-full flex items-center">
            <div className="flex items-center">
              <img src={clamIcon} className="max-h-48" />
              <p>Clam Island</p>
            </div>
            <img src={ mStatus ? close : open } onClick={toggle} />
          </div>
        </nav>
        
        <div className="overlay_m_items"  style={{height: mStatus ? "100%" : "0px" }}>
          <div className="overlay_m_container px-6 py-4 w-full" style={{height: "100%"}}>
            <div className="flex justify-between">
              <p></p>
              <img src={ mStatus ? close : open } onClick={toggle} />
            </div>
            <div className="text-center items-center pt-5">
              {address ? (
                <>
                  {/* <Navbar onDisconnect={onDisconnect} /> */}
                </>
              ) : (
                <button type="button" className="connect_btn" onClick={onConnect}>
                  Connect Wallet
                </button>
              )}

              <div className="mt-5">
                {
                  NAV_ROUTES.map((item, index) => {
                    return (
                      <>
                        <div className="mt-3">
                          <Link to={item.url} onClick={toggle}>{item.title}</Link>
                        </div>
                      </>
                    );
                  })
                }
              </div>

              
              {address ? (
                <>
                  <Navbar onDisconnect={onDisconnect} />
                </>
              ) : (
                <>
                  {/* <button type="button" className="connect_btn" onClick={onConnect}>
                    Connect Wallet
                  </button> */}
                </>
              )}

              <div style={{display: mStatus ? "flex" : "none", position: "absolute", bottom: "0", left: "0", width: "100%"}} className="flex justify-center">
              <a
                  className="social-btn m-0"
                  href="https://twitter.com/clam_island"
                  target="_blank"
                  rel="noreferrer"
                >
                  <button className="nav-icon" style={{ width: "32px", height: "auto" }}>
                    <img src={IMG_LOC + "twitter-32.png"} />
                  </button>
                </a>
                <a
                  className="social-btn"
                  href="https://discord.gg/F4ak27n8Sh"
                  target="_blank"
                  rel="noreferrer"
                >
                  <button className="nav-icon" style={{ width: "32px", height: "auto" }}>
                    <img src={IMG_LOC + "discord_gray.png"} />
                  </button>
                </a>
                <a
                  className="social-btn"
                  href="https://t.me/clamisland"
                  target="_blank"
                  rel="noreferrer"
                >
                  <button className="nav-icon" style={{ width: "32px", height: "auto" }}>
                    <img src={IMG_LOC + "telegram_gray.png"} />
                  </button>
                </a>
                <a
                  className="social-btn"
                  href="https://clamisland.medium.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <button className="nav-icon" style={{ width: "32px", height: "auto" }}>
                    <img src={IMG_LOC + "medium_gray.png"} />
                  </button>
                </a>
              </div>


            </div>

          </div>
        </div>
      </>
      {/* )} */}
    </>
  );
};

// just send everything
const mapToProps = (redux) => redux;
export default connect(mapToProps, actions)(Web3ProvidersModal);
