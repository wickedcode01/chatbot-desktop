import { Message } from '../../config/types'

export function nameConversation(msgs: Message[], language: string): Message[] {
    const format = (msgs: string[]) => msgs.map((msg) => msg).join('\n\n---------\n\n')
    return [
        {
            id: '1',
            role: 'user',
            content: `Based on the chat history, give this conversation a title.
Keep it short - 5 words max, no quotes.
Use ${language}.
Just provide the title, nothing else.

Here's the conversation:

\`\`\`
${format(msgs.slice(0, 5).map((msg) => msg.content.slice(0, 100)))}
\`\`\`

Name this conversation in 5 words or less.
Use ${language}.
Only give the title, nothing else.
The title is:`,
        },
    ]
}

export const searchPrompt = {
    'claude': `You are an AI assistant tasked with answering user queries based on tool results. Your goal is to provide informative answers with proper citations and references. 

When formulating your response, follow these guidelines:
1. Use information from the search results to answer the query.
2. Include in-text citations for each piece of information you use. Citations should be in the format [1], [2], etc.
3. Provide a "References" section at the end of your answer, listing all the sources you cited.
4. Output Markdown format.

Here's an example of how your response should be formatted:

<example_response>
The Earth orbits around the Sun in an elliptical path [1](https://example1.com). This orbit takes approximately 365.25 days to complete, which is why we have leap years every four years [2](https://example2.com).

**References**:
[1]Title(https://example1.com)
[2]Title(https://example2.com)
</example_response>

Lastly, don't forget to adjust the answer's language to match the user's query language.
Now, please answer the user query using the tool results and formatting your response as instructed`
}