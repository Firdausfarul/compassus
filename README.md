# Compassus

Ethereum developer tooling web app for contract interaction, storage inspection, and transaction tracing.

## Features

### 1. Arbitrary Call
Interact with any smart contract without needing a full frontend.

- **ABI Input**: Paste a contract ABI JSON to get all available functions
- **Manual Signature**: Type function signatures manually (e.g., `transfer(address to, uint256 amount)`)
- **Struct/Array Support**: Full support for complex types including nested structs and arrays
- **Custom Return Type**: Decode return values with custom type definitions
- **Simulate or Send**: Use `eth_call` to simulate or send actual transactions

**Supported signature formats:**
```
balanceOf(address owner)
transfer(address to, uint256 amount)
swap(uint256[] calldata amounts, address[] memory path)
addLiquidity((address tokenA, address tokenB, uint256 amountA) params)
```

### 2. Storage Inspect
Read raw storage slots from any contract.

- **Direct Slot Query**: Read any storage slot by number (hex or decimal)
- **Array Helper**: Query array length and elements by index or range
- **Mapping Helper**: Calculate and query mapping slots with support for:
  - Single mappings: `mapping(address => uint256)`
  - Nested mappings: `mapping(address => mapping(uint256 => bool))`
  - Multiple key types: address, uint256, bytes32, string

### 3. Trace Tx
Trace transaction execution and state changes.

- **Call Trace Tree**: Visualize the full call hierarchy
- **Balance Diff**: See ETH balance changes per address
- **Storage Diff**: See storage slot changes per contract

**Supported trace methods:**
- `trace_replayTransaction` (Erigon, Nethermind, Besu)
- `debug_traceTransaction` (Geth, Anvil, Alchemy, Infura)

## Tech Stack

- React 18 + Vite
- viem (Ethereum library)
- Tailwind CSS v4
- Static build output

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploy to Cloudflare Pages

#### Option 1: Direct Upload (Easiest)

1. Build the project:
   ```bash
   npm run build
   ```

2. Go to [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)

3. Click **"Create a project"** > **"Direct Upload"**

4. Name your project (e.g., `compassus`)

5. Drag and drop the `dist` folder or click to upload

6. Click **"Deploy site"**

Your site will be live at `https://compassus.pages.dev` (or your chosen name)

#### Option 2: Git Integration (Auto-deploy on push)

1. Push your code to GitHub/GitLab

2. Go to [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)

3. Click **"Create a project"** > **"Connect to Git"**

4. Select your repository

5. Configure build settings:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or subdirectory if applicable)

6. Click **"Save and Deploy"**

Future pushes to your main branch will auto-deploy.

#### Option 3: Wrangler CLI

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Deploy:
   ```bash
   wrangler pages deploy dist --project-name=compassus
   ```

### Deploy to Other Static Hosts

#### Vercel
```bash
npm run build
npx vercel deploy dist
```

#### Netlify
```bash
npm run build
npx netlify deploy --dir=dist --prod
```

#### GitHub Pages
```bash
npm run build
npx gh-pages -d dist
```

#### Self-hosted (Nginx)
```nginx
server {
    listen 80;
    server_name compassus.example.com;
    root /var/www/compassus/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Usage Tips

### Connecting to Networks

- **MetaMask**: Click "Connect MetaMask" to use your browser wallet
- **Custom RPC**: Enter any RPC URL (Infura, Alchemy, local node, etc.)

### Function Signatures

When entering manual function signatures, you can include Solidity keywords:
```
transfer(address to, uint256 amount)
swap(uint256[] calldata amounts, address[] memory path, address to)
batchTransfer((address recipient, uint256 amount)[] calldata transfers)
```

### Custom Return Types

For functions without ABI output definitions, specify return types:
```
uint256
(address, uint256)
(uint256 id, string name, bool active)
(address owner, uint256 balance)[]
```

### Storage Slot Calculation

- **Simple variables**: Stored sequentially starting at slot 0
- **Dynamic arrays**: Length at slot N, data at `keccak256(N) + index`
- **Mappings**: Value at `keccak256(abi.encode(key, slot))`
- **Nested mappings**: `keccak256(abi.encode(key2, keccak256(abi.encode(key1, slot))))`

## License

MIT
