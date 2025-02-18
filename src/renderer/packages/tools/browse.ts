import { getDefaultStore } from 'jotai'
import * as atoms from '../../stores/atoms'

export const browse = async (urls: string[], options?: { includeHtmlTags?: boolean; maxCharacters?: number }) => {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const { exaAPIKey } = settings
    if(!exaAPIKey){
        throw new Error('Please input your exa api key')
    }
    const requestBody = {
        ids: urls,
        text: {
            maxCharacters: options?.maxCharacters ?? 10000,
            includeHtmlTags: options?.includeHtmlTags ?? false,
        },
        // livecrawl: "always"
    }

    const response = await fetch('https://api.exa.ai/contents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': exaAPIKey,
        },
        body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
        throw new Error(`Error fetching content: ${response.statusText}`)
    }

    const data = await response.json()
    return data
}
