import { stringifyProcessEnvs } from './envs';
import { getOptimizeDeps } from './optimizeDeps';
import { commonConfig } from './vite-config';
import { Router } from 'express';
import { Server } from 'http';
import type { EnvsRaw, ExtendedOptions } from './types';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import ts from 'typescript';
import { json } from 'body-parser';

export async function createEditingServer(options: ExtendedOptions, devServer: Server, router: Router) {
  const { port, presets } = options;

  const baseConfig = await commonConfig(options, 'development');
  const defaultConfig = {
    ...baseConfig,
    server: {
      middlewareMode: true,
      hmr: {
        port,
        server: devServer,
      },
      fs: {
        strict: true,
      },
    },
    appType: 'custom' as const,
    optimizeDeps: await getOptimizeDeps(baseConfig, options),
  };

  const finalConfig = await presets.apply('viteFinal', defaultConfig, options);

  const envsRaw = await presets.apply<Promise<EnvsRaw>>('env');
  // Stringify env variables after getting `envPrefix` from the final config
  const envs = stringifyProcessEnvs(envsRaw, finalConfig.envPrefix);
  // Update `define`
  finalConfig.define = {
    ...finalConfig.define,
    ...envs,
  };

  router.get('/getFile/:fileName(*)', async (req, res, next) => {
    const filePath = path.resolve(baseConfig.root, req.params.fileName);
    let as = getImports(filePath).importing.find((a) => a.startsWith('./'));
    if (as && !path.extname(as)) {
      as += path.extname(req.params.fileName);
    }
    const component = path.resolve(path.dirname(filePath), as ?? req.params.fileName);

    const file = readFileSync(component);
    res.status(200).json({
      path: component,
      content: file.toString(),
    });
  });

  const jsonParser = json();

  router.post('/saveFile', jsonParser, async (req, res, next) => {
    if (!req?.body?.path) {
      return res.status(400).send('error');
    }

    writeFileSync(req.body.path, req.body.content);
    res.status(200);
  });
}

const tsHost = ts.createCompilerHost(
  {
    allowJs: true,
    noEmit: true,
    isolatedModules: true,
    resolveJsonModule: false,
    moduleResolution: ts.ModuleResolutionKind.Classic, // we don't want node_modules
    incremental: true,
    noLib: true,
    noResolve: true,
  },
  true
);

function getImports(fileName: string) {
  const sourceFile = tsHost.getSourceFile(fileName, ts.ScriptTarget.Latest, (msg) => {
    throw new Error(`Failed to parse ${fileName}: ${msg}`);
  });
  if (!sourceFile) throw ReferenceError(`Failed to find file ${fileName}`);
  const importing: string[] = [];
  delintNode(sourceFile);
  return {
    importing,
  };

  function delintNode(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleName = node.moduleSpecifier.getText().replace(/['"]/g, '');
      importing.push(moduleName);
    } else ts.forEachChild(node, delintNode);
  }
}
