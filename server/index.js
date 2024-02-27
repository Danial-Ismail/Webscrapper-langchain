import express from "express"
import dotenv from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import cors from "cors";
import { OpenAI } from "@langchain/openai";
import {loadSummarizationChain} from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";

const corsOptions = {
    origin: "*",
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200
}


const app = express();
dotenv.config();

app.use(express.json());
app.use(cors(corsOptions));



app.get("/scrape", async (req, res) => {
    try {

        const url = req.query.url;
        const loader = new PuppeteerWebBaseLoader(url,
            {
                launchOptions: {
                    headless: "new",
                },
                gotoOptions: {
                    waitUntil: "domcontentloaded",
                },
                async evaluate(page, browser) {
                    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });

                    const result = await page.evaluate(() => {
                        const scripts = document.body.querySelectorAll("script")
                        const noscript = document.body.querySelectorAll("noscript");
                        const styles = document.body.querySelectorAll("style");
                        const scriptAndStyle = [...scripts, ...noscript, ...styles,];
                        scriptAndStyle.forEach((e) => e.remove());

                        const mainElement = document.querySelector('main');
                        return mainElement ? mainElement.innerText : document.body.innerText;
                    })
                    await browser.newPage()
                    return result
                }
            }
        );


        const docs = await loader.loadAndSplit();
        // res.json(docs);

        const model=new OpenAI({openAIApiKey:process.env.OPENAI_API_KEY,temperature:0,modelName:"gpt-3.5-turbo"});

        const prompt=new PromptTemplate({
            template:`Please summarize the following text.\n\n---\n{text}\n---\n\nSummary:`,
            inputVariables:["text"]
        })

        const chain=loadSummarizationChain(model,{
            combineMapPrompt:prompt,
            combinePrompt:prompt,
            type:"map_reduce"
        });
        const result=await chain.invoke({
            input_documents:docs
        });
        res.json({ summarizedResult: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message)
    }
})

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
