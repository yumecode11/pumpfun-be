const { format: formatUsdCurrency } = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function formatDollar(price?: number | null) {
  return price !== undefined && price !== null ? formatUsdCurrency(price) : '-'
}

function formatNumber(
  amount: number | null | undefined | string,
  maximumFractionDigits: number = 2
) {
  const { format } = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maximumFractionDigits,
  })
  if (!amount) {
    return '-'
  }
  return format(+amount)
}

const truncateFractionAndFormat = (
  parts: Intl.NumberFormatPart[],
  digits: number
) => {
  return parts
    .map(({ type, value }) => {
      if (type !== 'fraction' || !value || value.length < digits) {
        return value
      }

      let formattedValue = ''
      for (let idx = 0; idx < value.length && idx < digits; idx++) {

        formattedValue += value[idx]
      }
      return formattedValue
    })
    .reduce((string, part) => string + part)
}

/**
 *  Convert ETH values to human readable formats
 * @param amount An ETH amount
 * @param maximumFractionDigits Number of decimal digits
 * @param decimals Number of decimal digits for the atomic unit
 * @returns returns the ETH value as a `string` or `-` if the amount is `null` or `undefined`
 */
function formatBN(
  amount: bigint | number | null | undefined,
  maximumFractionDigits: number,
  decimals: number = 18
) {
  if (typeof amount === 'undefined' || amount === null) return '-'

  const amountToFormat =
    typeof amount === 'number'
      ? amount
      : (Number(amount) / (10 ** decimals))

  if (amountToFormat === 0) {
    return amountToFormat
  }

  const amountFraction = `${amount}`.split('.')[1]
  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 20,
    useGrouping: true,
    notation: 'compact',
    compactDisplay: 'short',
  }

  const parts = new Intl.NumberFormat('en-US', formatOptions).formatToParts(
    amountToFormat
  )

  if (parts && parts.length > 0) {
    const lowestValue = Number(
      `0.${new Array(maximumFractionDigits).join('0')}1`
    )
    if (amountToFormat > 1000) {
      return truncateFractionAndFormat(parts, 1)
    } else if (amountToFormat < 1 && amountToFormat < lowestValue) {
      return `< ${lowestValue}`
    } else {
      return truncateFractionAndFormat(parts, maximumFractionDigits)
    }
  } else {
    return typeof amount === 'string' || typeof amount === 'number'
      ? `${amount}`
      : ''
  }
}

export { formatDollar, formatBN, formatNumber }
