const ETH_DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(ETH_DECIMALS)

export function ethToWei(value: string): bigint {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) {
    throw new Error('Valor em ETH inválido.')
  }

  const [integer, decimal = ''] = value.split('.')

  return (
    BigInt(integer) * WEI_PER_ETH +
    BigInt(decimal.padEnd(ETH_DECIMALS, '0'))
  )
}

export function weiToEth(value: bigint): string {
  if (value < 0n) {
    throw new Error('O valor em ETH não pode ser negativo.')
  }

  const integer = value / WEI_PER_ETH
  const decimal = (value % WEI_PER_ETH)
    .toString()
    .padStart(ETH_DECIMALS, '0')
    .replace(/0+$/, '')

  return decimal ? `${integer}.${decimal}` : integer.toString()
}