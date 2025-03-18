import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  ReclaimProofRequest,
  Proof,
  transformForOnchain,
} from "@reclaimprotocol/js-sdk";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  CLOUTCOIN_CONTRACT_ADDRESS,
  CLOUTCOIN_CONTRACT_ABI,
} from "../utils/constants";
import { config } from "./main";
import { useBalance } from "wagmi";

function ReclaimDemo() {
  const { isConnected, address } = useAccount();
  const [requestUrl, setRequestUrl] = useState("");
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [username, setUsername] = useState("");
  const [followersCount, setFollowersCount] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const {
    writeContractAsync,
    data: txData,
    error: txError,
  } = useWriteContract({
    config,
  });

  const { data: balance, error: balanceError } = useBalance({
    token: CLOUTCOIN_CONTRACT_ADDRESS,
    address: address,
  });


  useEffect(() => {
    console.log("Balance:", balance);
    console.log("Balance error:", balanceError);

    if (balance) {
      setUserBalance(Number(balance.value) / 10 ** balance.decimals);
    }
    if (balanceError) {
      console.error("Balance error:", balanceError);
    }
  }, [balance, balanceError]);

  const {
    data: receipt,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txData || undefined,
  });

  useEffect(() => {
    if (txError) {
      console.error("Transaction error:", txError);
    }
    if (receiptError) {
      console.error("Receipt error:", receiptError);
    }
  }, [txError, receiptError]);

  const getVerificationReq = async () => {
    const APP_ID = "0x9a6AC46DCD8ADa0ca7f6d8a99CEB82C850BF7b91";
    const APP_SECRET =
      "0x11eccf097e2352aedc70397dde3c358fbf35c2fe0d17f0970a4025d53d638f1a";
    const PROVIDER_ID = "e6fe962d-8b4e-4ce5-abcc-3d21c88bd64a";

    let isMobileDevice =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        navigator.userAgent.toLocaleLowerCase()
      ) || window.orientation > -1;
    navigator.userAgent.toLocaleLowerCase().includes("android");
    let isAppleDevice =
      /mac|iphone|ipad|ipod/i.test(navigator.userAgent.toLocaleLowerCase()) ||
      void 0;
    let deviceType = isMobileDevice
      ? isAppleDevice
        ? "ios"
        : "android"
      : "desktop";

    const reclaimProofRequest = await ReclaimProofRequest.init(
      APP_ID,
      APP_SECRET,
      PROVIDER_ID,
      {
        device: deviceType,
        useAppClip: "desktop" !== deviceType,
      }
    );
    if (deviceType !== "desktop") {
      reclaimProofRequest.setRedirectUrl(
        "https://reclaim-onchain-starterkit-evm.vercel.app/"
      );
    }
    const requestUrl = await reclaimProofRequest.getRequestUrl();

    const statusUrl = await reclaimProofRequest.getStatusUrl();
    localStorage.setItem("statusUrl", statusUrl);

    setRequestUrl(requestUrl);

    await reclaimProofRequest.startSession({
      onSuccess: (proofs) => {
        if (typeof proofs === "string") return proofs;
        let proofsArray: Proof[] = [];
        if (proofs) {
          proofsArray = Array.isArray(proofs) ? proofs : [proofs];
        }

        console.log("Verification success", proofs);
        const transformedProofs = proofsArray.map((proof) =>
          transformForOnchain(proof)
        );
        console.log("Transformed proofs:", transformedProofs);
        setProofs(proofsArray);
        setRequestUrl("");

        if (proofsArray.length > 0 && proofsArray[0]?.claimData?.context) {
          try {
            const extractedUsername = JSON.parse(
              proofsArray[0].claimData.context
            )?.extractedParameters?.screen_name;
            setUsername(extractedUsername);
            const extractedFollowersCount = JSON.parse(
              proofsArray[0].claimData.context
            )?.extractedParameters?.followers_count;
            setFollowersCount(extractedFollowersCount);
          } catch (error) {
            console.error("Error parsing claimData context:", error);
          }
        }
      },
      onError: (error) => {
        console.error("Verification failed", error);
      },
    });
  };

  useEffect(() => {
    const statusUrl = localStorage.getItem("statusUrl");
    if (isConnected && !proofs.length) {
      if (statusUrl) {
        fetch(statusUrl)
          .then((response) => response.json())
          .then((res) => {
            if (!res.session?.proofs?.length) {
              getVerificationReq();
            }
          });
      } else {
        getVerificationReq();
      }
    }
  }, [isConnected]);

  useEffect(() => {
    const statusUrl = localStorage.getItem("statusUrl");
    if (statusUrl) {
      console.log("Status URL:", statusUrl);
      fetch(statusUrl)
        .then((response) => response.json())
        .then((res) => {
          if (res.session?.proofs) {
            setProofs(res.session.proofs);
            const transformedProofs = res.session.proofs.map((proof: Proof) =>
              transformForOnchain(proof)
            );
            console.log("Transformed proofs:", transformedProofs);
            setUsername(
              JSON.parse(res.session.proofs[0].claimData.context)
                ?.extractedParameters?.screen_name
            );
            const extractedFollowersCount = JSON.parse(
              res.session.proofs[0].claimData.context
            )?.extractedParameters?.followers_count;
            setFollowersCount(extractedFollowersCount);
          }
        })
        .catch((error) => {
          console.error("Error fetching proofs:", error);
        });
    }
  }, []);

  const getNFTPreview = () => {
    return (
      <div className="bg-gray-100 p-6 rounded-lg text-center">
        <p className="text-gray-700 text-lg mb-2">You will be receiving</p>
        <p className="text-gray-700 text-xl font-semibold">{followersCount * 1000} CLT tokens</p>
      </div>
    );
  };

  const handleMint = async () => {
    try {
      const proof = proofs[0];
      console.log("Proof:", proof);
      if (!proof) {
        throw new Error("No proof available to mint");
      }
      const transformedproof = transformForOnchain(proof);
      console.log("Transformed proof:", transformedproof);
      await writeContractAsync({
        address: CLOUTCOIN_CONTRACT_ADDRESS,
        abi: CLOUTCOIN_CONTRACT_ABI,
        functionName: "mint",
        args: [transformedproof],
      });
    } catch (error) {
      console.error("Error minting NFT:", error);
      // You can add additional error handling here
    }
  };

  const handleVerifyAnother = () => {
    localStorage.removeItem("statusUrl");
    setProofs([]);
    setUsername("");
    getVerificationReq();
  };

  const renderMintButton = () => (
    <div className="flex flex-col items-center">
      <button
        onClick={handleMint}
        className="mt-6 px-6 py-3 text-white text-lg font-semibold rounded-lg transition-all bg-green-500 hover:bg-green-600"
      >
        Claim Cloutcoins
      </button>
      {isConfirmed && receipt && (
        <div className="mt-2 text-sm">
          <a
            href={`https://explorer.execution.testnet.lukso.network/tx/${receipt.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            View on Block Explorer
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-8 p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold text-center">
        Claim Your Cloutcoins based on your Twitter Followers
      </h1>
      <ConnectButton />
      {isConnected && (
        <div className="w-full max-w-lg p-6 bg-gray-800 rounded-2xl shadow-lg text-center">
          {requestUrl && !proofs.length && (
            <div className="my-5 flex flex-col items-center">
              <p className="text-lg mb-3">
                Scan or tap (if on mobile) the QR Code to Verify
              </p>
              <div
                className="p-4 bg-white rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => window.open(requestUrl, "_blank")}
              >
                <QRCode
                  value={requestUrl}
                  size={180}
                  onClick={() => window.open(requestUrl, "_blank")}
                />
              </div>
            </div>
          )}
          {username && (
            <div className="mt-6">
              <div className="flex items-center justify-center gap-3 mb-5 bg-gray-700 px-4 py-2 rounded-lg">
                <span className="text-lg font-medium">
                  Username: {username}
                  <br />
                  Followers: {followersCount}
                  <br />
                  Current Balance: {userBalance}
                </span>
                <button
                  onClick={handleVerifyAnother}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  title="Verify Another"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-center">{getNFTPreview()}</div>
              {balance && balance.value > BigInt(0) ? (
                <div className="mt-6 text-yellow-400 font-semibold">
                  You have already claimed your Cloutcoins!
                </div>
              ) : (
                renderMintButton()
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReclaimDemo;
