"use strict";
const fetch = require("node-fetch");
// Node-Record-lpcm16
const recorder = require("node-record-lpcm16");

// Imports the Google Cloud client library
const speech = require("@google-cloud/speech");

const puppeteer = require("puppeteer");
const { exec } = require("child_process");
class APIdata {}
class DialogCore {
  constructor(config, request, client) {
    this.config = config;
    this.request = request;
    this.client = client;
    this.current_request = "";
  }

  async coreIntentService(speech) {
    const q = encodeURIComponent(speech);
    console.log("speech ", speech, " q ", q);
    const uri = "https://api.wit.ai/message?v=" + process.env.WITID + "&q=" + q;
    const auth = "Bearer " + process.env.WITAUTH;
    let respuesta;
    await fetch(uri, { headers: { Authorization: auth } })
      .then((res) => res.json())
      .then((res) => {
        respuesta = res;
        ClientServiceExecutor(res);
      });
  }
  coreDialogoService(current_request) {
    this.coreIntentService(current_request);
  }

  controladorDialogo(request = 0, client = 0, estado) {
    switch (estado) {
      case "sin_procesar":
        let text = this.asrService(request, client);
        return text;
        break;
      case "procesado":
        console.log("checlpoint");
        this.coreIntentService(this.current_request);
        break;
      default:
        break;
    }
  }
  asrService(request, client) {
    return client
      .streamingRecognize(request)
      .on("error", console.error)
      .on("data", (data) => {
        console.log(data);
        process.stdout.write(
          data.results[0] && data.results[0].alternatives[0]
            ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
            : "\n\nReached transcription time limit, press Ctrl+C\n"
        );
        this.current_request = data.results[0].alternatives[0].transcript;
        this.controladorDialogo(0, 0, "procesado");
        //getIntent(data.results[0].alternatives[0].transcript);
      });
  }
}
function EjecutarComando(app) {
  exec("open -a " + app, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}
function ClientServiceExecutor(entities) {
  console.log("clientserviceexecutor ", entities);
  let intencion = entities.intents[0].name;
  switch (intencion) {
    case "open_software_app":
      let app = entities.entities["programa:programa"];
      console.log("app a abrir:", app[0].value, "largo:", app[0].value.length);
      if (app[0].value == "mis documentos" || app[0].value == "mis carpetas") {
        EjecutarComando("Finder");
      }
      if (app[0].value == "calculadora") {
        EjecutarComando("Calculator.app");
      }
      if (app[0].value == "bloc de notas") {
        EjecutarComando("TextEdit texto.txt");
      }
      if (
        app[0].value == "código" ||
        app[0].value == "visual" ||
        app[0].value == "visual studio code" ||
        app[0].value == "visual studio"
      ) {
        EjecutarComando("Visual\\ Studio\\ Code.app");
      }

      break;
    case "buscar":
      let buscar = entities.entities["wit$search_query:search_query"];
      console.log("buscar ", buscar[0].value);
      try {
        (async () => {
          const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
          });
          const page = await browser.newPage();
          await page.goto("https://google.com");
          await page.type("input.gLFyf.gsfi", buscar[0].value);
          page.keyboard.press("Enter");
          await page.waitForSelector("div#resultStats");
          const links = await page.$$("div.r");
          await links[0].click();
        })();
      } catch (err) {
        console.error(err);
      }
      break;
    case "play_music":
      let artista = entities.entities["artista:artista"];
      let cancion = entities.entities["cancion:cancion"];
      console.log("artista ", artista[0].value, " cancion ", cancion[0].value);
      try {
        (async () => {
          const browser = await puppeteer.launch({ headless: false });
          const page = await browser.newPage();
          await page.goto("https://youtube.com");
          try {
            await page.waitForSelector('input[id="search"]', { timeout: 5000 });
          } catch (e) {
            return results;
          }
          const input = await page.$('input[id="search"]');
          await input.click({ clickCount: 3 });
          console.log(artista[0].value + " " + cancion[0].value);
          await page.type("#search", artista[0].value + " " + cancion[0].value);
          await page.click("button#search-icon-legacy");
          await page.waitForSelector("ytd-thumbnail.ytd-video-renderer");
          const videos = await page.$$("ytd-thumbnail.ytd-video-renderer");
          await videos[0].click();
          await page.waitForSelector(".html5-video-container");
          await page.waitFor(5000);
        })();
      } catch (err) {
        console.error(err);
      }
      break;
    default:
      break;
  }
}

async function ClientService(encoding, sampleRateHertz, languageCode) {
  // [START micStreamRecognize]
  console.log(encoding, sampleRateHertz, languageCode);
  const config = {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  };

  const request = {
    config,
    interimResults: false, //Get interim results from stream
  };

  // Creates a client
  const client = new speech.SpeechClient();

  let dialogcore = new DialogCore(config, request, client);
  // Create a recognize stream
  /*const recognizeStream = client
    .streamingRecognize(request)
    .on("error", console.error)
    .on("data", (data) => {
      console.log(data);
      process.stdout.write(
        data.results[0] && data.results[0].alternatives[0]
          ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
          : "\n\nReached transcription time limit, press Ctrl+C\n"
      );
      getIntent(data.results[0].alternatives[0].transcript);
    });*/

  // Start recording and send the microphone input to the Speech API
  await recorder
    .record({
      sampleRateHertz: sampleRateHertz,
      threshold: 0, //silence threshold
      recordProgram: "rec", // Try also "arecord" or "sox"
      silence: "5.0", //seconds of silence before ending
    })
    .stream()
    .on("error", console.error)
    .pipe(
      dialogcore.controladorDialogo(
        dialogcore.request,
        dialogcore.client,
        "sin_procesar"
      )
    );

  console.log("Listening, press Ctrl+C to stop.");
  // [END micStreamRecognize]
}

ClientService("LINEAR16", 16000, "es-CL");

/*
require("yargs")
  .demand(1)
  .command(
    "micStreamRecognize",
    "Streams audio input from microphone, translates to text",
    {},
    (opts) =>
      microphoneStream(opts.encoding, opts.sampleRateHertz, opts.languageCode)
  )
  .options({
    encoding: {
      alias: "e",
      default: "LINEAR16",
      global: true,
      requiresArg: true,
      type: "string",
    },
    sampleRateHertz: {
      alias: "r",
      default: 16000,
      global: true,
      requiresArg: true,
      type: "number",
    },
    languageCode: {
      alias: "l",
      default: "es-CL",
      global: true,
      requiresArg: true,
      type: "string",
    },
  })
  .example("node $0 micStreamRecognize")
  .wrap(120)
  .recommendCommands()
  .epilogue("For more information, see https://cloud.google.com/speech/docs")
  .help()
  .strict().argv;*/
