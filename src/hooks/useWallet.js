import { useState, useCallback } from 'react'
import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { mainnet } from 'viem/chains'

const defaultChains = {
  1: { id: 1, name: 'Ethereum', network: 'mainnet', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } } },
  11155111: { id: 11155111, name: 'Sepolia', network: 'sepolia', nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://sepolia.gateway.tenderly.co'] } } },
  8453: { id: 8453, name: 'Base', network: 'base', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.base.org'] } } },
  84532: { id: 84532, name: 'Base Sepolia', network: 'base-sepolia', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://sepolia.base.org'] } } },
  42161: { id: 42161, name: 'Arbitrum One', network: 'arbitrum', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } } },
  10: { id: 10, name: 'Optimism', network: 'optimism', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://mainnet.optimism.io'] } } },
  137: { id: 137, name: 'Polygon', network: 'polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: { default: { http: ['https://polygon-rpc.com'] } } },
}

export function useWallet() {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [rpcUrl, setRpcUrl] = useState('')
  const [publicClient, setPublicClient] = useState(null)
  const [walletClient, setWalletClient] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [connectionType, setConnectionType] = useState(null) // 'metamask' or 'rpc'

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed')
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId'
      })
      const connectedChainId = parseInt(chainIdHex, 16)

      const chain = defaultChains[connectedChainId] || {
        id: connectedChainId,
        name: `Chain ${connectedChainId}`,
        network: 'unknown',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [] } }
      }

      const pClient = createPublicClient({
        chain,
        transport: custom(window.ethereum)
      })

      const wClient = createWalletClient({
        chain,
        transport: custom(window.ethereum),
        account: accounts[0]
      })

      setAccount(accounts[0])
      setChainId(connectedChainId)
      setPublicClient(pClient)
      setWalletClient(wClient)
      setConnectionType('metamask')

      // Listen for account/chain changes
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          disconnect()
        } else {
          setAccount(newAccounts[0])
        }
      })

      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })

      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const connectRpc = useCallback(async (url) => {
    if (!url) {
      setError('RPC URL is required')
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      const pClient = createPublicClient({
        transport: http(url)
      })

      // Test the connection
      const connectedChainId = await pClient.getChainId()

      setRpcUrl(url)
      setChainId(connectedChainId)
      setPublicClient(pClient)
      setWalletClient(null) // No wallet with RPC-only
      setAccount(null)
      setConnectionType('rpc')

      return true
    } catch (err) {
      setError(`Failed to connect: ${err.message}`)
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setPublicClient(null)
    setWalletClient(null)
    setConnectionType(null)
    setRpcUrl('')
    setError(null)
  }, [])

  const getChainName = () => {
    if (!chainId) return null
    return defaultChains[chainId]?.name || `Chain ${chainId}`
  }

  return {
    account,
    chainId,
    chainName: getChainName(),
    rpcUrl,
    publicClient,
    walletClient,
    isConnecting,
    error,
    connectionType,
    isConnected: !!publicClient,
    hasWallet: !!walletClient,
    connectMetaMask,
    connectRpc,
    disconnect
  }
}
