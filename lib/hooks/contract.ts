import { AddressZero } from "@ethersproject/constants";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import {
  ChainId,
  TransactionStatus,
  useCall,
  useContractFunction,
  useEthers,
} from "@usedapp/core";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { Interface, isAddress, parseEther } from "ethers/lib/utils";
import { useCallback, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { CONTRACTS } from "../../config";
import { DNA, KittyContract, MarketplaceContract } from "../../types";
import KittyJson from "../abis/KittyContract.json";
import MarketJson from "../abis/MarketplaceContract.json";

const KittyContractInterface = new Interface(KittyJson.abi);
const MarketplaceContractInterface = new Interface(MarketJson.abi);

const getSigner = (library: Web3Provider, account: string): JsonRpcSigner => {
  return library.getSigner(account);
};

const getProviderOrSigner = (
  library: Web3Provider,
  account?: string
): Web3Provider | JsonRpcSigner => {
  return account ? getSigner(library, account) : library;
};

const getContract = (
  address: string,
  ABI: any,
  library: Web3Provider,
  account?: string
): Contract => {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  return new Contract(address, ABI, getProviderOrSigner(library, account));
};

const useContract = (
  address: string | undefined,
  ABI: any,
  withSignerIfPossible = true
): Contract | null => {
  const { library, account } = useEthers();
  return useMemo(() => {
    if (!address || address === AddressZero || !ABI || !library) {
      return null;
    }

    try {
      return getContract(
        address,
        ABI,
        library as Web3Provider,
        withSignerIfPossible && account ? account : undefined
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to get contract", error);
      return null;
    }
  }, [address, ABI, library, withSignerIfPossible, account]);
};

export function useChainId() {
  const { chainId } = useEthers();

  switch (chainId) {
    case ChainId.Mumbai:
      return chainId;
    case ChainId.Polygon:
      return chainId;
    default:
      return ChainId.Mumbai;
  }
}

const useKittyContract = (withSignerIfPossible?: boolean) => {
  const chainId = useChainId();

  const kittiContract = useContract(
    CONTRACTS[chainId].kitty,
    KittyContractInterface,
    withSignerIfPossible
  ) as unknown as KittyContract | null;

  return useMemo(() => kittiContract, [kittiContract]);
};

const useMarketplaceContract = (withSignerIfPossible?: boolean) => {
  const chainId = useChainId();

  const marketplaceContract = useContract(
    CONTRACTS[chainId].marketplace,
    MarketplaceContractInterface,
    withSignerIfPossible
  ) as unknown as MarketplaceContract | null;

  return useMemo(() => marketplaceContract, [marketplaceContract]);
};

export const useTotalSupply = () => {
  const contract = useKittyContract(false);

  const { value, error } =
    useCall(
      contract && {
        contract,
        method: "totalSupply",
        args: [],
      }
    ) ?? {};
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }

  return useMemo(() => value?.[0], [value]);
};

const convertDnaToGenes = (dna: DNA): BigNumber => {
  let genes = "";

  Object.values(dna).forEach((dnaValue) => {
    genes += dnaValue;
  });

  return BigNumber.from(genes);
};

export const useDnaToGenes = (dna: DNA): BigNumber => {
  return useMemo(() => convertDnaToGenes(dna), [dna]);
};

type UseContractNotificationType = {
  resetState: () => void;
  status: TransactionStatus["status"];
  errorMessage: string;
  miningMessage: string;
  successMessage: string;
};

export const useContractNotification = ({
  resetState,
  status,
  errorMessage,
  miningMessage,
  successMessage,
}: UseContractNotificationType) => {
  const toastRef = useRef("");

  useEffect(() => {
    switch (status) {
      case "Exception":
      case "Fail": {
        resetState();
        if (!errorMessage) return;

        const toastId = toast.error(errorMessage, {
          id: toastRef.current,
          duration: 6000,
        });
        toastRef.current = toastId;
        break;
      }

      case "Mining": {
        if (!miningMessage) return;

        const toastId = toast.loading(miningMessage, { id: toastRef.current });
        toastRef.current = toastId;
        break;
      }

      case "Success": {
        resetState();
        if (!successMessage) return;

        const toastId = toast.success(successMessage, {
          id: toastRef.current,
          duration: 6000,
        });
        toastRef.current = toastId;
        break;
      }
    }
  }, [errorMessage, miningMessage, resetState, status, successMessage]);
};

export const useGen0Price = () => {
  const contract = useKittyContract(false);

  const { value, error } =
    useCall(
      contract && {
        contract,
        method: "getGen0Price",
        args: [],
      }
    ) ?? {};
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }

  return useMemo(() => value?.[0], [value]);
};

export const useIsApprovedForAll = (address?: string | null) => {
  const contract = useKittyContract();
  const chainId = useChainId();
  const { value, error } =
    useCall(
      address &&
        contract && {
          contract,
          method: "isApprovedForAll",
          args: [address, CONTRACTS[chainId].marketplace],
        }
    ) ?? {};
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error.message);
  }

  return useMemo(() => value?.[0], [value]);
};

export const useSetApprovalForAll = (approved: boolean | null) => {
  const contract = useKittyContract();
  const chainId = useChainId();
  const address = CONTRACTS[chainId].marketplace;
  const approve = useContractFunction(
    contract as KittyContract,
    "setApprovalForAll"
  );

  useContractNotification({
    resetState: approve.resetState,
    status: approve.state.status,
    errorMessage: `Error - approval for all tokens \n${approve.state.errorMessage} `,
    miningMessage: `Loading - set approval for all tokens`,
    successMessage: `Success - set approval for all tokens`,
  });

  const onApprove = useCallback(() => {
    if (!address || approved == undefined) {
      return;
    }

    return approve.send(address, approved);
  }, [address, approve, approved]);

  return useMemo(() => {
    return { ...approve, onApprove };
  }, [approve, onApprove]);
};

export const useCreateListing = (price?: string, tokenId?: BigNumberish) => {
  const contract = useMarketplaceContract();
  const createListing = useContractFunction(
    contract as MarketplaceContract,
    "setOffer"
  );

  useContractNotification({
    resetState: createListing.resetState,
    status: createListing.state.status,
    errorMessage: `Error - create listing \n${createListing.state.errorMessage} `,
    miningMessage: `Loading - create listing`,
    successMessage: `Success - create listing`,
  });

  const onCreateListing = useCallback(() => {
    if (!price || !tokenId) {
      return;
    }

    return createListing.send(parseEther(price), tokenId);
  }, [createListing, price, tokenId]);

  return useMemo(() => {
    return { ...createListing, onCreateListing };
  }, [createListing, onCreateListing]);
};

export const useRemoveListing = (tokenId?: BigNumberish) => {
  const contract = useMarketplaceContract();
  const removeListing = useContractFunction(
    contract as MarketplaceContract,
    "removeOffer"
  );

  useContractNotification({
    resetState: removeListing.resetState,
    status: removeListing.state.status,
    errorMessage: `Error - remove listing \n${removeListing.state.errorMessage} `,
    miningMessage: `Loading - remove listing`,
    successMessage: `Success - remove listing`,
  });

  const onRemoveListing = useCallback(() => {
    if (!tokenId) {
      return;
    }

    return removeListing.send(tokenId);
  }, [removeListing, tokenId]);

  return useMemo(() => {
    return { ...removeListing, onRemoveListing };
  }, [removeListing, onRemoveListing]);
};

export const useCreateGen0Kitty = (dna: DNA) => {
  const contract = useKittyContract();
  const gen0Price = useGen0Price();
  const create = useContractFunction(
    contract as KittyContract,
    "createKittyGen0"
  );
  const genes = useDnaToGenes(dna);

  useContractNotification({
    resetState: create.resetState,
    status: create.state.status,
    errorMessage: `Error - create Gen0 Kitty: \n${create.state.errorMessage} `,
    miningMessage: `Loading - create Gen0 Kitty with genes: ${genes.toString()}...`,
    successMessage: `Success - create Gen0 Kitty with genes: ${genes.toString()}`,
  });

  const onCreate = useCallback(() => {
    if (!gen0Price) {
      return;
    }

    return create.send(genes, { value: gen0Price });
  }, [create, gen0Price, genes]);

  return useMemo(() => {
    return { ...create, onCreate };
  }, [create, onCreate]);
};

export const useBreed = (momId: BigNumberish, dadId: BigNumberish) => {
  const contract = useKittyContract();
  const breed = useContractFunction(contract as KittyContract, "breed");

  useContractNotification({
    resetState: breed.resetState,
    status: breed.state.status,
    errorMessage: `Error - breeding \n${breed.state.errorMessage} `,
    miningMessage: `Loading - breed kitty...`,
    successMessage: `Success - breed kitty`,
  });

  const onBreed = useCallback(
    () => breed.send(momId, dadId),
    [breed, dadId, momId]
  );

  return useMemo(() => {
    return { ...breed, onBreed };
  }, [breed, onBreed]);
};

export const useBuyKitty = (price?: BigNumberish, tokenId?: BigNumberish) => {
  const contract = useMarketplaceContract();
  const buy = useContractFunction(contract as MarketplaceContract, "buyKitty");

  useContractNotification({
    resetState: buy.resetState,
    status: buy.state.status,
    errorMessage: `Error - buy kitty \n${buy.state.errorMessage} `,
    miningMessage: `Loading - buy kitty...`,
    successMessage: `Success - buy kitty`,
  });

  const onBuy = useCallback(() => {
    if (!tokenId || !price) {
      return;
    }

    buy.send(tokenId, { value: price });
  }, [buy, price, tokenId]);

  return useMemo(() => {
    return { ...buy, onBuy };
  }, [buy, onBuy]);
};
