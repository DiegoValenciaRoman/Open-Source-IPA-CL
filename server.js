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
            ? `Transcripcion: ${data.results[0].alternatives[0].transcript}\n`
            : "\n\nLimite de transcripciones, presione Ctrl+c\n"
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
    //cambiar segun sistema operativo (actual macOS)
    //TODO: estandarizar
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
    //estandarizado
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
    //estandarizado con youtube
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
  console.log(encoding, sampleRateHertz, languageCode);
  const config = {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  };

  const request = {
    config,
    interimResults: false,
  };

  // Crear cliente
  const client = new speech.SpeechClient();

  let dialogcore = new DialogCore(config, request, client);
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

  // empieza a grabar el input del microfono y enviarlo al controlador de dialogo
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

  console.log("Escuchando, persiona Ctrl+C para terminar.");
}

ClientService("LINEAR16", 16000, "es-CL");
