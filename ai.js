


import { generateText, tool } from 'ai';
import { get } from 'http';
import { ollama } from 'ollama-ai-provider';
import { z } from 'zod';

async function getShoePrice(prompt) {
    console.log("El prompt que pasaste es: ", prompt)
    const {text} = await generateText({
        model: ollama('llama3.2'),
        tools: {
            shoes: tool({
                description: 'Get the shoe price at Nike US given a model',
                parameters: z.object({
                    shoeModel: z.literal('KD 17').describe('Shoe model to get the price for')
                }),
                execute: async({shoeModel})=>{
                    console.log(shoeModel)
                    const params= new URLSearchParams({
                        marketplace: 'us',
                        language: 'en',
                        searchTerms: shoeModel
                    });
                    const nikeResponse = await fetch(`https://api.nike.com/search/visual_searches/v1?${params}`).then(res => res.json())
                    /* const nikeResponse = await fetch(`https://api.nike.com/search/visual_searches/v1?marketplace=us&language=en&searchTerms=kd%2017`)
                        .then(res => res.json()) */
                    console.log("Nike response: ", nikeResponse)
                    console.log("El precio es: $", nikeResponse.objects[0].prices.salePrice)
                    //@ts-ignore
                    const price = nikeResponse.objects[0].prices.salePrice
                    return price;
                }
            })
        },
        prompt: 'What is the price for KD 17 Shoes?',
        system: 'You are a helpful agent that can provide prices from Nike US',
        maxSteps: 3
    });
    
    console.log(text);
}

console.log(getShoePrice("parametro aca!"));