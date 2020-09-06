# Open Source Intelligent Personal Assistant

OsIPACL es un asistente inteligente open source

## Requerimientos

- Tener un modelo entrenado en Wit.ai (facebook) y su token auth para usar la API (a continuación se muestran los intents y entities).
  ![Intents](https://image.prntscr.com/image/TBPNRnHWSC6TJCneUFqNMQ.png)
  ![Entities](https://image.prntscr.com/image/SGvNPaxaRIGdxrrteHQkHQ.png)

- Tener la api de Google cloud Speech-to-text con el json de autorizacion.

## Instalación

Usando npm

```bash
npm install
```

## Uso

Usando npm

```bash
export GOOGLE_APPLICATION_CREDENTIALS="trus_credenciales_google.json"
```

```bash
WITID=tu_id WITAUTH="tu_token" node server.js
```

## Estado

De momento solo se tiene una demo de una pequeña parte del sistema.

## Arquitectura

Proximamente.

## Contributing

Pull request son bienvenidos.
Proximamente.

## License

[MIT](https://choosealicense.com/licenses/mit/)
