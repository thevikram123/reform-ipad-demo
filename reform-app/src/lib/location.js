function normalise(value = '') {
  return value.toLowerCase().replace(/\b(district|division)\b/g, '').replace(/[^a-z]/g, '')
}

export function addressFromGeocode(data, geo, currentState = 'Maharashtra') {
  const address = data?.address || {}
  const state = geo[address.state] ? address.state : currentState
  const districts = geo[state] || []
  const districtCandidates = [
    address.state_district,
    address.district,
    address.county,
    address.city_district,
  ].filter(Boolean)

  const district = districts.find((item) => districtCandidates.some((candidate) => {
    const known = normalise(item)
    const found = normalise(candidate)
    return found && (known === found || known.includes(found) || found.includes(known))
  })) || ''

  const city = address.city
    || address.town
    || address.village
    || address.municipality
    || address.city_district
    || address.suburb
    || ''

  return {
    state,
    district,
    city,
    pin: address.postcode || '',
    location: [address.neighbourhood, address.suburb, address.road].filter(Boolean).join(', '),
    displayName: data?.display_name || '',
  }
}
