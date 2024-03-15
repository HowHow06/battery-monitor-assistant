# Battery Monitor Assistant

This is a node app I've written to automatically turn on / off my laptop charger based on my laptop battery level.

To use this app, you will need a smart socket that is connected to Google Home app, and it must be also connected to Google Assistant so that it can be turned on / off by using Google Assistant (For example, by telling Google Assistant `Turn off my charger`).

If you are interested in using this app, refer to the installation guide below.

---

# Credit

This project uses the [google-assistant](https://github.com/endoplasmic/google-assistant) package from endoplasmic.

This project also refers to [Assistant Relay](https://github.com/greghesp/assistant-relay) app by greghesp.

---

# Installation & Setup

## Installing Node.js Dependencies

This project requires certain Node.js packages, which can be installed using Yarn. Follow these steps to install the necessary packages:

### Install Yarn

If you haven't installed Yarn on your system, follow the [official installation instructions](https://yarnpkg.com/getting-started/install) to set it up.

### Install Dependencies with Yarn

Navigate to the project's root directory and run the following command to install the project's Node.js dependencies:

```bash
yarn install
```

This command reads the `package.json` file and installs all the dependencies listed there.

## Setting Up the Virtual Environment

To ensure consistent performance across different environments, this project uses a Python virtual environment. Follow the steps below to set up the virtual environment named `venv` for development:

### Step 1: Install virtualenv

If you haven't already, install the `virtualenv` package globally. This tool allows creating isolated Python environments. Open a terminal or command prompt and run:

```bash
pip install virtualenv
```

### Step 2: Create the Virtual Environment

Navigate to the project's root directory and run the following command to create a virtual environment named `venv`:

```bash
virtualenv venv
```

This command creates a `venv` directory in the project root, containing the virtual environment.

### Step 3: Activate the Virtual Environment

Before working on the project, activate the virtual environment using the appropriate command for your operating system:

- **Windows**:
  ```cmd
  .\venv\Scripts\activate
  ```
- **macOS and Linux**:
  ```bash
  source venv/bin/activate
  ```

Upon activation, your terminal prompt will change to indicate that you are working inside the `venv` environment.

### Step 4: Install Required Packages

With the virtual environment activated, install the project's dependencies by running:

```bash
pip install -r requirements.txt
```

This command installs all the necessary Python packages as specified in the `src/requirements.txt` file.

### Step 5: Deactivate the Virtual Environment

Once you're done working on the project, you can deactivate the virtual environment by running:

```bash
deactivate
```

This command returns your terminal to the global Python environment.

### Note

Ensure you activate the `venv` environment whenever you work on this project to maintain dependency consistency and avoid conflicts with the global Python environment.

---

## Starting the Project

After setting up the Python virtual environment and installing the Node.js dependencies, you can start the project. This process is slightly different depending on your operating system.

### For Windows Users

We have prepared a batch script named `start.bat` to simplify the process. This script activates the Python virtual environment, then starts the project. Optionally, it can run a different Yarn command if an argument is provided.

To start the project with the default `yarn start` command, run:

```cmd
start.bat
```

To run a different command, such as `yarn test`, pass the command as an argument:

```cmd
start.bat test
```

### For macOS/Linux Users (not tested)

Create a shell script named `start.sh` with executable permissions using the following steps:

1. Make the script executable:

   ```bash
   chmod +x start.sh
   ```

2. To start the project, run:

   ```bash
   ./start.sh
   ```

   To run a different Yarn command, such as `yarn test`, pass the command as an argument:

   ```bash
   ./start.sh test
   ```

---

## Configuring Google Credentials

To get started with Assistant Relay, you will first need to setup a project in the Google Cloud Console to integrate with.

> Make sure you are signed into the Google Account you want this to work with!

Reference: [Configure a Developer Project and Account Settings](https://developers.google.com/assistant/sdk/guides/service/python/embed/config-dev-project-and-account)
A Google Cloud Platform project, managed by the Actions Console, gives your project access to the Google Assistant API. The project tracks quota usage and gives you valuable metrics for the requests made from your hardware.

To enable access to the Google Assistant API, perform the following steps:

1. Open the [Actions Console](https://console.actions.google.com/).
2. Click New project.
3. To create a new project, enter a name in the Project name box and click CREATE PROJECT. If you already have an existing Google Cloud Platform project, you can select that project and import it rather than creating a new one.
4. If you created a new project, when asked `What kind of Action do you want to build?`, click `Smart Home`.
5. Enable the Google Assistant API on the project you selected. You need to do this in the [Cloud Platform Console](https://console.developers.google.com/apis/api/embeddedassistant.googleapis.com/overview). Click Enable.
6. You must configure the [OAuth consent screen](https://console.developers.google.com/apis/credentials/consent) for your project in the Cloud Platform Console. Note that most fields on this page are optional.
7. Go to the [Google Developer Console](https://console.developers.google.com/) and ensure that your project is selected from the dropdown at the top
8. Click on the `Credentials` link in the left hand menu
9. At the top, click the `+ Create Credentials` button and select `OAuth Client ID`
10. Select `Web application` from the dropdown list
11. Give your client ID a name, such as `MyBatteryMonitorAssistant`.
12. Under `Authorized redirect URIs`, add a random URI (as long as it is a valid URI and the domain is not used by any other party), for example: `http://localhost:5000/auth`
13. Click `Create`.
14. Click the `Download` button to download your credentials json file.

---

## Setting up the App for the first time

Now that you have your credentials json file downloaded, it's time to setup the battery monitor assistant.

1. Run the command `yarn setup` to initialze the battery monitor assistant.
2. Then, run the command `yarn auth --credential=<path to your credentials json file>` to initialze the battery monitor assistant (you may put the credentials json file into `bin` directory and delete it afterward).
3. In your terminal/command window, you will see a message giving you a link to authenticate yourself via Google OAuth Client. Open this link in a web browser.
4. Login with your google account.
5. Assuming your redirect URI (which you've added when creating the OAuth client) is `http://localhost:5000/auth`, upon authentication, you will be redirected to the URI `http://localhost:5000/auth?code=<auth code>&scope=https://www.googleapis.com/auth/assistant-sdk-prototype`.
6. Copy the auth code in the URI, and paste it back to the terminal:

```cmd
Please enter the auth code or auth url:
```

7. You should be authenticated.

## Configuring Battery Monitor Assistant

- Battery Monitor Assistant supports pushbullet notification. Optionally you can pass add your pushbullet API key to `/bin/config.json` file.
- You can also adjust the `batteryLevel.low` and `batteryLevel.high` value in the config file. The charger will be turned on when the battery level is below the low threshold and will be turned off when the battery level is above the high threshold

## Start using Battery Monitor Assistant

1. Run the command `start.bat start` to start using the battery monitor assistant. Battery level will be checked every 10 minutes.

Note: By default, the charger name is `my charger`. If smart socket is not named `my charger` in your Google Home app, kindly pass the argument `--charger=<charger name>` when running the `start.bat start` command. For example: `start.bat start --charger='new charger'`
