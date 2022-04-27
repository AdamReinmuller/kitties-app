import { ChainId, useEthers } from "@usedapp/core";

export const SUPPORTED_NETWORKS: Record<
  number,
  {
    chainId: string;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls: string[];
  }
> = {
  [ChainId.Mumbai]: {
    chainId: "0x13881",
    chainName: "Mumbai",
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
    blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
  },
};

export const useNetworkHelper = () => {
  const { library, account } = useEthers();

  if (!account || !library) {
    return { changeOrAddNetwork: undefined };
  }

  const changeOrAddNetwork = async (chainId: ChainId) => {
    const params = SUPPORTED_NETWORKS[chainId];
    try {
      await library.send("wallet_switchEthereumChain", [
        { chainId: SUPPORTED_NETWORKS[chainId].chainId },
        account,
      ]);
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await library.send("wallet_addEthereumChain", [params, account]);
        } catch (addError) {
          // handle "add" error
          // eslint-disable-next-line no-console
          console.error(`Add chain error ${addError}`);
        }
      }
      // eslint-disable-next-line no-console
      console.error(`Switch chain error ${switchError}`);
    }
  };

  return { changeOrAddNetwork };
};
