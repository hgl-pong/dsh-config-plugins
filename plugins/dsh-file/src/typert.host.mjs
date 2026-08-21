import { z } from 'zod';

const passthrough = z.custom(() => true);

const jsonParam = (name) => ({
  name,
  wire: name,
  source: 'json',
  codec: { mode: 'strict', typeSymbol: 'json', schema: passthrough },
});

const jsonResult = { mode: 'strict', typeSymbol: 'json', schema: passthrough };

const direct = (method, parameters) => ({
  id: `dsh-file#fileManager/${method}`,
  service: 'fileManager',
  namespace: 'fileManager',
  method,
  invocation: { kind: 'direct' },
  parameters: parameters.map(jsonParam),
  result: jsonResult,
});

export const TYPERT = {
  package: 'dsh-file',
  face: 'host',
  schemas: [],
  invocations: [
    direct('listDir', ['path']),
    direct('readText', ['path']),
    direct('readDataUrl', ['path']),
    direct('writeText', ['path', 'content']),
    direct('createFile', ['path']),
    direct('createDirectory', ['path']),
    direct('rename', ['from', 'to']),
    direct('delete', ['path']),
    direct('stat', ['path']),
    direct('resolve', ['path']),
    direct('getRoot', []),
    direct('setRoot', ['path']),
  ],
  model: { services: [], events: [], objects: [] },
};
