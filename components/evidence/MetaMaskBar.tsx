"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  connectMetaMask,
  switchMetaMaskNetwork,
  POLYGON_AMOY_CHAIN_ID,
  HARDHAT_LOCAL_CHAIN_ID,
  DEFAULT_CONTRACT_ADDRESS,
} from "@/services/evidenceRegistryService";
import { Shield, Link2, CheckCircle2, AlertCircle, Copy, Check } from "lucide-react";

interface MetaMaskBarProps {
  contractAddress: string;
  onContractAddressChange: (addr: string) => void;
  onWalletConnected?: (address: string) => void;
}

export const MetaMaskBar: React.FC<MetaMaskBarProps> = ({
  contractAddress,
  onContractAddressChange,
  onWalletConnected,
}) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>("Disconnected");
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setFeedback(null);
    try {
      const res = await connectMetaMask();
      setWalletAddress(res.address);
      setNetworkName(res.networkName);
      setChainId(res.chainId);
      if (onWalletConnected) onWalletConnected(res.address);
      setFeedback(`Connected: ${res.address.slice(0, 6)}...${res.address.slice(-4)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect MetaMask";
      setFeedback(msg);
    } finally {
      setConnecting(false);
    }
  }, [onWalletConnected]);

  // Check if already authorized
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum && window.ethereum.selectedAddress) {
      handleConnect();
    }
  }, [handleConnect]);

  const handleSwitchNetwork = async (targetChainId: string) => {
    try {
      await switchMetaMaskNetwork(targetChainId);
      setTimeout(handleConnect, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network switch failed";
      setFeedback(msg);
    }
  };

  const handleCopyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-gradient-to-r from-surface-container via-surface-container to-surface-container-low p-5 space-y-4 shadow-xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-on-surface">Web3 &amp; MetaMask Smart Contract Portal</span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${
                  walletAddress
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                    : "bg-surface-container-high text-outline border-outline-variant"
                }`}
              >
                {walletAddress ? "EVM Connected" : "Standalone Ledger"}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Zero-Gas public verification via smart contract call &amp; direct Polygon Amoy signing
            </p>
          </div>
        </div>

        {/* Connect Button */}
        <div className="flex items-center space-x-2">
          {walletAddress ? (
            <div className="flex items-center space-x-2.5 bg-surface-container-low px-3.5 py-2 rounded-xl border border-outline-variant font-mono text-xs shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-cyan-400 font-bold">
                {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
              </span>
              <span className="text-[10px] text-outline font-medium">({networkName})</span>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-cyan-900/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{connecting ? "Connecting..." : "Connect MetaMask"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Network switchers & Contract address row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-outline-variant/60 text-xs">
        <div>
          <label className="text-[10px] uppercase font-bold tracking-wider text-outline font-mono block mb-1.5">
            Quick Network Switch
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleSwitchNetwork(HARDHAT_LOCAL_CHAIN_ID)}
              className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant text-[11px] font-mono transition shadow-sm"
              title="Switch to Hardhat Localhost:8545"
            >
              Localhost 8545
            </button>
            <button
              onClick={() => handleSwitchNetwork(POLYGON_AMOY_CHAIN_ID)}
              className="px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-700/40 text-[11px] font-mono transition shadow-sm"
              title="Switch to Polygon Amoy Testnet (80002)"
            >
              Polygon Amoy
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-[10px] uppercase font-bold tracking-wider text-outline font-mono block mb-1.5">
            EvidenceRegistry Smart Contract Target Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => onContractAddressChange(e.target.value)}
              placeholder={DEFAULT_CONTRACT_ADDRESS}
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-3.5 pr-10 py-2 font-mono text-cyan-300 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition"
            />
            <button
              type="button"
              onClick={handleCopyContract}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-cyan-300 p-1 transition"
              title="Copy Contract Address"
            >
              {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="text-[11px] font-mono text-outline flex items-center space-x-2 pt-1">
          {feedback.startsWith("Connected") ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span className="truncate">{feedback}</span>
        </div>
      )}
    </div>
  );
};
