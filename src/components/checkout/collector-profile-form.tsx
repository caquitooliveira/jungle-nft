import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import type {
  CollectorProfile,
  WalletProvider,
} from '@/types/order'
import type { Network } from '@/types/nft'

interface CollectorProfileFormProps {
  profile: CollectorProfile
  network: Network
  address: string
  provider: WalletProvider
  disabled: boolean
  onProfileChange: (profile: CollectorProfile) => void
  onNetworkChange: (network: Network) => void
  onAddressChange: (address: string) => void
  onProviderChange: (provider: WalletProvider) => void
}

const inputClass =
  'mt-2 h-12 w-full rounded-md border border-[#705039]/60 bg-transparent px-3 text-sm text-[#f5eee8] placeholder:text-[#b79460]'

const selectClass =
  'mt-2 h-12 w-full rounded-md border border-[#705039]/60 bg-[#160e0a] px-3 text-sm text-[#f5eee8]'

export function CollectorProfileForm({
  profile,
  network,
  address,
  provider,
  disabled,
  onProfileChange,
  onNetworkChange,
  onAddressChange,
  onProviderChange,
}: CollectorProfileFormProps) {
  const addressRef = useRef<HTMLInputElement>(null)
  const [useOtherWallet, setUseOtherWallet] = useState(false)

  function updateProfile(
    field: keyof CollectorProfile,
    value: string,
  ) {
    onProfileChange({ ...profile, [field]: value })
  }

  // Compatibilidade com rascunhos antigos que salvavam só a extensão.
  const ensName =
    profile.ensName === '.eth' || profile.ensName === '.sol'
      ? ''
      : profile.ensName

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="mb-6 text-lg font-bold">
        Perfil do colecionador
      </legend>

      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <label htmlFor="checkout-display-name" className="text-sm">
            Nome de exibição <span className="text-[#e6a15a]">*</span>
          </label>

          <Input
            id="checkout-display-name"
            required
            maxLength={100}
            value={profile.displayName}
            onChange={(event) =>
              updateProfile('displayName', event.target.value)
            }
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="checkout-username" className="text-sm">
            Nome de usuário <span className="text-[#e6a15a]">*</span>
          </label>

          <Input
            id="checkout-username"
            required
            maxLength={100}
            value={profile.username}
            onChange={(event) =>
              updateProfile('username', event.target.value)
            }
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="checkout-network" className="text-sm">
            Rede <span className="text-[#e6a15a]">*</span>
          </label>

          <select
            id="checkout-network"
            required
            value={network}
            onChange={(event) =>
              onNetworkChange(event.target.value as Network)
            }
            className={selectClass}
          >
            <option value="" disabled>
              Selecione uma rede
            </option>
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="solana">Solana</option>
          </select>
        </div>

        <div>
          <label htmlFor="checkout-profile-name" className="text-sm">
            Nome do perfil <span className="text-[#e6a15a]">*</span>
          </label>

          <Input
            id="checkout-profile-name"
            required
            maxLength={100}
            value={profile.profileName}
            onChange={(event) =>
              updateProfile('profileName', event.target.value)
            }
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="checkout-address" className="text-sm">
            Endereço da carteira
            <span className="text-[#e6a15a]"> *</span>
          </label>

          <Input
            ref={addressRef}
            id="checkout-address"
            required
            maxLength={44}
            pattern={
              network === 'solana'
                ? '11111111111111111111111111111111'
                : '0x1111111111111111111111111111111111111111'
            }
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            placeholder={
              network === 'solana'
                ? 'Endereço Solana'
                : 'Endereço 0x da carteira'
            }
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="checkout-secondary-wallet"
            className="text-sm"
          >
            Carteira secundária (opcional)
          </label>

          <Input
            id="checkout-secondary-wallet"
            maxLength={100}
            value={profile.secondaryWallet}
            onChange={(event) =>
              updateProfile('secondaryWallet', event.target.value)
            }
            placeholder="Endereço da carteira secundária"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="checkout-wallet-type" className="text-sm">
            Tipo de carteira <span className="text-[#e6a15a]">*</span>
          </label>

          <select
            id="checkout-wallet-type"
            required
            value={provider}
            onChange={(event) =>
              onProviderChange(event.target.value as WalletProvider)
            }
            className={selectClass}
          >
            <option value="" disabled>
              Selecione uma carteira
            </option>
            <option value="metamask">MetaMask</option>
            <option value="walletconnect">WalletConnect</option>
            <option value="coinbase">Coinbase Wallet</option>
          </select>
        </div>

        <div>
          <label htmlFor="checkout-referral" className="text-sm">
            Código de indicação <span className="text-[#e6a15a]">*</span>
          </label>

          <Input
            id="checkout-referral"
            required
            maxLength={100}
            value={profile.referralCode}
            onChange={(event) =>
              updateProfile('referralCode', event.target.value)
            }
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="checkout-email" className="text-sm">
            E-mail <span className="text-[#e6a15a]">*</span>
          </label>

          <Input
            id="checkout-email"
            type="email"
            required
            maxLength={254}
            value={profile.email}
            onChange={(event) =>
              updateProfile('email', event.target.value)
            }
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="checkout-ens" className="text-sm">
            Nome ENS (opcional)
          </label>

          <Input
            id="checkout-ens"
            maxLength={100}
            value={ensName}
            onChange={(event) =>
              updateProfile('ensName', event.target.value)
            }
            placeholder="Ex.: caio.eth"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={useOtherWallet}
              onChange={(event) => {
                const checked = event.target.checked
                setUseOtherWallet(checked)

                if (checked) {
                  onAddressChange('')
                  addressRef.current?.focus()
                }
              }}
              className="size-4 accent-[#cf8946]"
            />

            Usar outra carteira?
          </label>

          {useOtherWallet && (
            <p className="mt-2 text-xs text-[#c9b6a5]">
              Informe o novo endereço no campo Endereço da carteira.
              Esse será o destino dos NFTs na compra simulada.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="checkout-observation" className="text-sm">
            Observação do colecionador (opcional)
          </label>

          <textarea
            id="checkout-observation"
            maxLength={500}
            rows={7}
            value={profile.observation}
            onChange={(event) =>
              updateProfile('observation', event.target.value)
            }
            className="mt-2 w-full rounded-md border border-[#705039]/60 bg-transparent p-3 text-sm"
          />
        </div>
      </div>
    </fieldset>
  )
}