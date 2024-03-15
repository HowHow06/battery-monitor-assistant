# battery-monitor-assistant

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
