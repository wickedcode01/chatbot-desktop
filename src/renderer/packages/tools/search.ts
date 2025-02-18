import { getDefaultStore } from 'jotai'
import * as atoms from '../../stores/atoms'

export const performSearch = async (input: InputObj) => {
    // auto swicth
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const { googleCx, googleAPIKey, exaAPIKey } = settings
    let engine;
    if(exaAPIKey){
        engine = 1;
    }
    // using google only when exa is absent
    else if (googleCx && googleAPIKey){
        engine = 2
    }
    console.info(input);
    switch (engine) {
        case 1:
            return exaSearch(input)
        case 2:
            return googleSearch(input)
        default:
            throw new Error('Please input your api key')
    }
}

const googleSearch = async (input: InputObj): Promise<string> => {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const { googleCx, googleAPIKey } = settings
    const { query, num } = input
    try {
        const params = {
            key: googleAPIKey,
            cx: googleCx,
            q: query,
            num: num ?? '5',
        }
        const url = `https://www.googleapis.com/customsearch/v1?${new URLSearchParams(params).toString()}`
        const response = await fetch(url)
        const data = await response.json()
        return data.items
    } catch (error) {
        throw new Error(String(error))
    }
}
const exaSearch = async (input: InputObj) => {
    const store = getDefaultStore()
    const settings = store.get(atoms.settingsAtom)
    const { exaAPIKey } = settings
    const { num } = input
    const options = {
        method: 'POST',
        headers: { 'x-api-key': exaAPIKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...input,
            type: 'keyword', // available parameters: auto, neural, keyword
            numResults: num ?? 5,
            contents:{
                text:{
                    maxCharacters: 10000
                },
                // summary: true
            }
            // useAutoprompt: false,
            // category: "company",
            // includeDomains: ["example.com"], 
            // excludeDomains: ["excludedomain.com"], 
            // startCrawlDate: "2023-01-01T00:00:00.000Z", 
            // endCrawlDate: "2023-12-31T00:00:00.000Z", 
            // includeText: ["keyword"], 
            // excludeText: ["excluded_keyword"], 
        }),
    }
    const response = await fetch('https://api.exa.ai/search', options)
    const data = await response.json()
    return data.results
}
interface InputObj {
    query: string
    num?: string // 返回的结果数量，默认为 5
    useAutoprompt?: boolean // 是否使用自动提示
    type?: string // The Type of search, 'keyword', 'neural', or 'auto' (decides between keyword and neural). Default neural.
    category?: string // 分类，Available options: company, research paper, news, linkedin profile, github, tweet, movie, song, personal site, pdf, financial report
    // 其他可能的参数
    includeDomains?: string[] // 包含的域名
    excludeDomains?: string[] // 排除的域名
    startCrawlDate?: string // 开始爬取日期
    endCrawlDate?: string // 结束爬取日期
    includeText?: string[] // 包含的文本
    excludeText?: string[] // 排除的文本
}
