const fs = require("fs");
const mic = require("mic");
const { Readable } = require("stream");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
require('dotenv').config()

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(configuration);
ffmpeg.setFfmpegPath(ffmpegPath);

// Record audio
function recordAudio(filename) {
  return new Promise((resolve, reject) => {
    const micInstance = mic({
      rate: '16000',
      channels: '1',
      fileType: 'wav',
    });

    const micInputStream = micInstance.getAudioStream();
    const output = fs.createWriteStream(filename);
    const writable = new Readable().wrap(micInputStream);

    console.log('Recording... Press Ctrl+C to stop.');

    writable.pipe(output);

    micInstance.start();

    process.on('SIGINT', () => {
      micInstance.stop();
      console.log('Finished recording');
      resolve();
    });

    micInputStream.on('error', (err) => {
      reject(err);
    });
  });
}


// Transcribe audio
async function transcribeAudio(filename) {
  const transcript = await openai.createTranscription(
    fs.createReadStream(filename),
    "whisper-1"
  );
  return transcript.data.text;
}

async function main() {
  const audioFilename = 'recorded_audio.wav';
  await recordAudio(audioFilename);
  const transcription = await transcribeAudio(audioFilename);
  console.log('Transcription:', transcription);
  
  //TODO: we can use this text for further processing
  // like summarization, finding recopies etc
}


main();