> ## The English version of this document is [here](./Readme.en.md)

# Introducció

Quan els usuaris creen un compte a la instància Mastodon, és maco donar-los una acollidora benvingunda amb un missatge agradable.

Aquest projecte ha estat dissenyat com a una [Netlify function](https://docs.netlify.com/functions/overview/) que periòdicament consulta les [notificacions d'usuari de Mastodon](https://docs.joinmastodon.org/methods/notifications/), les filtra per tipus d' `admin.sign_up`  i finalment publica un missatge de benvinguda als usuaris que s'han donat d'alta. Es pot fer esment de l'usuari al missatge.

Per tal d'evitar l'enviament del missatge de benvinguda més d'un cop al mateix usuari, el procés emmagatzema a una base de dades el darrer ID de `admin.sign_up` un cop enviat el missatge. El sistema gestor de base de dades pot ser MongoDb o PostgreSql.

La funció queda configurada per auto executar-se cada 5 minuts mitjançant  [netlify Scheduled Functions](https://docs.netlify.com/functions/scheduled-functions/). Es pot configurar al fitxer [netlify.toml](./netlify.toml). 


## Vols confidar aquest projecte a un cafè?

Utilitza el botó que trobaràs a sota per fer una donació que serveixi per ajudar amb les despeses d'infraestructura del node [mastodon.cat](https://mastodon.cat). Thank you!❤️❤️
[![Convida'ns a un cafè!!](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/L4L3H5BQL)


## Per què no usar simplement el webhook de Mastodon que es dispara quan es crea un usuari?

El webhook es dispara de manera instantània quan un usuari es registra, llavors el missatge de benvinguda s'enviaria abans que l'usuari completés la verificació. L'efecte seria que la menció a l'usuari no tindria efecte i, per tant, l'usuari no rebria notificació ni missatge de benvinguda.

En resum, `admin.sign_up` no es dispara quan l'usuari verifica el compte i, per aquest motiu, no serveix com a mecanisme d'inici d'enviament de missatge de benvinguda.

# Desplegar la funció

Pots usar el següent botó i les instruccions de sota per desplegar la funció a Netlify.

[![Desplegar a Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/mastodon-cat/mastodon-welcome-bot)


Si prefereixes fer-ho manualment, s'ha afegit un fitxer [netlify.toml](./netlify.toml) al projecte amb la configuració necessària per desplegar la funció.

De qualsevol manera, heu d'establir les "variables d'entorn" al lloc Netlify on es desplega la funció.


**Si us plau, llegiu la documentació de les variables d'entorn**.

Aquesta funció necessita que es creï una "aplicació Mastodon" perquè es puguin llegir les notificacions i enviar el missatge.

# Aplicació
Aneu a "/settings/applications" a la instància de Mastodon i creeu una aplicació nova. La nova aplicació només necessita un nom d'aplicació i els àmbits **`read:notifications`** i **`write:statuses`**. Per poder llegir les notificacions `admin.sign_up` l'aplicació ha de ser creada per un usuari amb suficients permisos.
Després de crear l'aplicació, es revelaran 3 claus: clau del client, secret del client i el vostre testimoni d'accés. `'Your access token'` serà el que farà servir la funció.

# Documentació
## Variables d'entorn
Aquesta funció es basa en variables d'entorn per poder enviar la publicació de benvinguda.
* **connectionstring** ➡️ La cadena de connexió a la base de dades. Ha de començar amb `mongodb://` o `mongodb+srv://` per a bases de dades MongoDb o amb `postgres://` per a bases de dades PostgresDb.
* **dbname** ➡️ El nom de la base de dades MongoDb o PostgresDb.
* **table** ➡️ El nom de la col·lecció MongoDb o la taula PostgresDb.

## Base de dades
La base de dades és molt senzilla. La funció es connectarà automàticament a MongoDb o Postgres en funció de com s'iniciï la cadena de connexió, seguint l'explicació de la **variable d'entorn de la cadena de connexió**.
- Per a MongoDb que consisteix en un sol document en una col·lecció amb l'estructura següent:
```ts
{
  _id: ObjectId;
  status: string;
  lastSignUpNotificationId: number;
  welcomeMessage: string;
  welcomeMessageVisibility: string;
  mastodonApiToken: string;
  mastodonInstanceName: string;
}
```
- per PostgresDb és basa en una filera en una taula amb la següent estructura:
```sql
CREATE TABLE {TABLE_NAME}
(
    id UUID DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY UNIQUE,
    status VARCHAR NOT NULL,
    "lastSignUpNotificationId" INT NOT NULL,
    "welcomeMessage" TEXT NOT NULL,
    "welcomeMessageVisibility" VARCHAR NOT NULL,
    "mastodonApiToken" VARCHAR NOT NULL,
    "mastodonInstanceName" VARCHAR NOT NULL
);
```

* **id** ➡️ L'Id del Document MongoDb. No és rellevant, però no es pot canviar.
* **status** ➡️ Pot ser `Iddle` (ociòs) or `Running` (executant-se).
* **lastSignUpNotificationId** ➡️ és l'identificador de l'última notificació `admin.sign_up` recuperada de Mastodon. Només s'actualitza després d'enviar amb èxit el missatge de benvinguda a l'usuari.
   * Per saber quin ha de ser aquest valor abans de desplegar les funcions, simplement executeu la següent sol·licitud. Us donarà les 100 darreres notificacions de registre. Trieu l'identificador de l'últim (o el que preferiu) i establiu el valor.
 ```curl 
 curl --location -g --request GET 'https://{INSTANCE_NAME}/api/v1/notifications?types[]=admin.sign_up' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer {MASTODON_API_TOKEN}'
 ```
* **welcomeMessage** ➡️ El missatge per enviar a l'usuari recent registrat. Per esmentar l'usuari, el text `{USERNAME}` (**majúscules**) ha d'estar present al text. El text pot ser de diverses línies.
* **mastodonApiToken** ➡️ El valor de  `'Your access token'` de l'aplicació Mastodon.
* **mastodonInstanceName** ➡️ El nom de la instància de Mastodont on l'usuari ha configurat el webhook. Per exemple `Mastodon.cat` seria un valor vàlid.

## Funció
[La functió](./src/functions/welcome-new-user.ts) s'executa seguint les següents passes:
1. Crea un client per treballar amb les col·leccions de MongoDb. El constructor del client assegura que totes les variables d'entorn necessàries per treballar amb MongoDb estan configurades.
2. Comprova que l'estat d'execució actual sigui "`Iddle`". Si no és així, no fa res. D'aquesta manera s'evita la concurrència.
3. Estableix l'estat d'execució actual a `Running` ("En execució").
4. Rep totes les notificacions des de l'última i les ordena per Id ASC.
5. Publica un missatge de benvinguda per a cada notificació `admin.sign_up`.
6. Torna a establir l'estat d'execució actual a "Iddle" i el "lastSignUpNotificationId" a l'ID de l'última notificació per a la qual s'ha enviat un missatge de benvinguda.
  
## Helpers
Algunes classes amb mètodes estàtics s'han creat per reutilitzar codi o per mantenir el codi principal de la funció el més senzill possible.

### [ErrorHelper](./src/functions/helpers/error-helper.ts)
Els errors al registre de Netlify són molt visuals perquè es mostren sobre un fons vermell.

* **HandleError** ➡️ Envia el missatge com a error a la consola abans de llançar una excepció.
### [EnvVariableHelpers](./src/functions/helpers/env-variable-helpers.ts)
Maneguen variables d'entorn
* **AssertEnvVariablesArePresent** ➡️ si falta alguna variable d'entorn necessària a la configuració, utilitza l'ajudant HandleError per llançar una excepció.
* **GetEnvironmentVariable** ➡️ L'existència de totes les variables d'entorn necessàries s'ha afirmat al principi de la funció cridant al mètode AssertEnvVariablesArePresent. A NodeJS, la recuperació d'una variable d'entorn amb `process.env.VariableName` o `process.env.['VariableName']` retorna una cadena nul·la (string?), però volem una cadena que no es pot anul·lar, de manera que evitem falses alertes al nostre codi. **GetEnvironmentVariable és només un mètode simple i de convenicència per obtenir un string en lloc dun string?**.
 
### [MastodonApiClient](./src/functions/helpers/mastodon-api-client.ts)
Una classe per encapsular sol·licituds a l'API Mastodon.
* **getLastSignUps** ➡️ Obté totes les notificacions de tipus `admin.sign_up` des de l'última.
* **publishStatus** ➡️ Construeix el cos JSON amb el missatge de benvinguda i la visibilitat seleccionada (`directa` si no està definit) i l'envia a l'API de Mastodon. Gestiona l'excepció.

### [IDbClient](./src/functions/interfaces/IDbClient.ts)
Una interfície per definir el contracte que els clients de MongoDb i Postgres han de complir la classe per encapsular el treball amb la base de dades.
* **getExecution** ➡️ Obté l'objecte amb les dades esmentades a la secció **Base de dades**.
* **updateExecutionStatus** ➡️ Estableix el valor de la propietat d'estat.
* **updateExecution** ➡️ Estableix aquest estat i els valors lastSignUpNotificationId.
* **dispose** ➡️ Tanca el client de base de dades.
* **initializeClient** ➡️ Inicialitza totes les propietats necessàries.
### [DbClientFactory](./src/functions/helpers/db-client-factory.ts)
Una classe amb la lògica necessària per decidir quina instància d'IDbClient ha d'instanciar, seguint el [Factory Pattern](https://en.wikipedia.org/wiki/Factory_method_pattern).
* **MongoCollectionHandler** ➡️ Implementació d'IDbClient per treballar amb MongoDb.
* **PostgresClient** ➡️ Implementació d'IDbClient per treballar amb Postgres.
