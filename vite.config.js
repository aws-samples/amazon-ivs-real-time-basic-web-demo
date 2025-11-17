import { defineConfig, loadEnv } from 'vite';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { fromIni } from '@aws-sdk/credential-providers';
import react from '@vitejs/plugin-react-swc';
import generouted from '@generouted/react-router/plugin';
import environment from 'vite-plugin-environment';
import readline from 'readline';
import process from 'process';
import { writeFileSync } from 'fs';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const awsProfile = process.env.AWS_PROFILE;
const cloudFormationClient = new CloudFormationClient(clientConfig);

let clientConfig = {};
if (awsProfile) {
  const credentialsProvider = fromIni({ profile: awsProfile });
  clientConfig = { credentials: credentialsProvider };
}

// Chunk deps to reduce module size
const manualChunks = (path) =>
  path.split('/').reverse()[
    path.split('/').reverse().indexOf('node_modules') - 1
  ]; // just a hack to get the next path segment of the last node_modules in path

const fetchApiUrl = async () => {
  try {
    const { Stacks } = await cloudFormationClient.send(
      new DescribeStacksCommand({ StackName: `AmazonIVSRTWebDemoStack` })
    );
    const [backendStack] = Stacks;
    const outputs = backendStack.Outputs;

    for (const output of outputs) {
      const value = findValueBySubstring(
        output,
        'AmazonIVSRTWebDemoApiEndpoint'
      );
      if (value) return value;
    }
  } catch (err) {
    throw new Error(err);
  }
};

const validateApiUrl = async () => {
  const validator = (response) => {
    const startsWithHttps = response.startsWith('https://');
    const endsWithSlash = response.at(-1) === '/';
    return startsWithHttps && endsWithSlash;
  };

  const validationMessage =
    '\nInvalid API URL provided. API URL must begin with `https://` and end with a `/`';
  return await readUserInput(`Enter your backend API URL: `, {
    validator,
    validationMessage,
  });
};

const initApiUrl = async () => {
  let apiUrl = undefined;
  try {
    apiUrl = await fetchApiUrl();
  } catch (err) {
    const shouldContinue = await confirmAction(
      `${err.message}. 
          \nCould not find a deployed backend. 
          \nDo you wish to manually set a backend API URL? [Y/n]`
    );

    if (!shouldContinue) {
      console.log('\nNo API_URL provided. Session join and create are disabled.\n');
      return 'undefined';
    }

    apiUrl = await validateApiUrl();
  }

  const shouldSave = await confirmAction(
    `API URL: ${apiUrl}
      \nDo you wish to save this API URL for future use? [Y/n]`
  );

  if (shouldSave) {
    try {
      const content = `API_URL=${apiUrl}`;
      writeFileSync('./.env', content);
    } catch (err) {
      console.error('Failed to write file:', err);
    }
  }

  return apiUrl;
};

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let apiUrl = env.API_URL ?? undefined;

  // If the apiUrl is not saved, ask the user to provide one
  if (apiUrl === undefined) {
    apiUrl = await initApiUrl();
  }

  // If the apiUrl is still undefined, set the API_URL to 'undefined'
  const plugins = [
    react(),
    generouted(),
    environment({
      API_URL: apiUrl,
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js',
          dest: './',
        },
        {
          src: 'node_modules/@ricky0123/vad-web/dist/*.onnx',
          dest: './',
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: './',
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.mjs',
          dest: './',
        },
      ],
    }),
  ];

  return {
    build: {
      sourcemap: false,
      rollupOptions: {
        output: { manualChunks },
      },
    },
    plugins,
  };
});

function findValueBySubstring(obj, substring) {
  const values = Object.values(obj);
  const matchingValues = values.filter((value) => value.includes(substring));
  if (matchingValues.length === 0) return null;
  return obj.OutputValue;
}

async function confirmAction(query) {
  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readlineInterface.on('SIGINT', () => process.exit(-1));

  const answer = await new Promise((resolve) => {
    readlineInterface.question(`\n${query} `, (ans) => {
      readlineInterface.close();
      resolve(ans);
    });
  });

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === '') {
    return true;
  }

  if (answer.toLowerCase() === 'n') {
    return false;
  }

  console.info('Invalid answer provided.');

  return confirmAction(query);
}

async function readUserInput(
  query,
  { validator = () => true, validationMessage = 'Invalid answer provided.' }
) {
  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readlineInterface.on('SIGINT', () => process.exit(-1));

  const answer = await new Promise((resolve) => {
    readlineInterface.question(`\n${query} `, (ans) => {
      readlineInterface.close();
      resolve(ans);
    });
  });

  if (validator(answer)) {
    return answer;
  }

  console.info(validationMessage);

  return readUserInput(query, validator);
}
