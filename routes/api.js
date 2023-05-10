const express = require("express");
const multer = require("multer");
const { Configuration, OpenAIApi } = require("openai");

const router = express.Router();
const upload = multer();

const configuration = new Configuration({
    apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);


async function completion(prompt) {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 2048,
        temperature: 0,
        top_p: 1,
        n: 1,
    });
    const { choices } = response.data;
    console.log(`summary response ::: ${JSON.stringify(choices)}`);
    // remove the spaces from the response text
    let reply = 'No summary found';
    if (choices && choices.length) {
        reply = choices?.[0].text || 'No summary found'
    }
    return reply;
}

async function transcribe(buffer) {
    const response = await openai.createTranscription(
        buffer,
        "whisper-1",
    )
    return response;
}

async function textSummarizer(text) {
    console.log(`Received the text for summary ::: ${text}`);
    const prompt = `Please summarize the below
    notes : 
    notes: ${text}
    Please produce output in the format
      <place your summary here>
    `;
   return await completion(prompt)
}

async function findRecipe(text) {
    console.log(`Received query ::: ${text}`);
    const prompt = `Please help me to find the recipe
    for: ${text}
    Please produce output in the format
        <total time to cook>
        <how to prepare the recipe>
        <Ingredients to order online>
    `;
   return await completion(prompt)
}

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "index.html"));
});

router.post("/completion", upload.any('file'), async (req, res) => {
    console.log('============POST request got==========')
    audio_file = req.files[0];
    queryType = req.body.queryType;
    console.log(`queryType ::: ${queryType}`);
    buffer = audio_file.buffer;
    buffer.name = audio_file.originalname;
    const transcribeResp = await transcribe(buffer);
    const transcribeText = transcribeResp?.data?.text;

    let aiReply;
    if (queryType == 'findRecipe') {
        aiReply = await findRecipe(transcribeText);
    } else {
        aiReply = await textSummarizer(transcribeText);
    }
    console.log(`aiReply ::: ${aiReply}`);
    res.send({
        type: "POST",
        transcription: transcribeText,
        summary: aiReply,
        audioFileName: buffer.name
    });
});

module.exports = router;