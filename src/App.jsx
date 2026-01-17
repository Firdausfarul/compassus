import { useState } from 'react'
import { Layout } from './components/Layout'
import { ArbitraryCall } from './features/arbitrary-call'
import { StorageInspect } from './features/storage-inspect'
import { TraceTx } from './features/trace-tx'
import { useWallet } from './hooks/useWallet'

function App() {
  const [activeTab, setActiveTab] = useState('call')
  const wallet = useWallet()

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'call' && <ArbitraryCall wallet={wallet} />}
      {activeTab === 'storage' && <StorageInspect wallet={wallet} />}
      {activeTab === 'trace' && <TraceTx wallet={wallet} />}
    </Layout>
  )
}

export default App
