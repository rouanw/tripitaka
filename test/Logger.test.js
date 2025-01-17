const { deepStrictEqual: eq } = require('assert');
const { TestOutputStream }  = require('./support');
const { Level, Logger, processors, transports } = require('..');

describe('Logger', () => {

  let streams;

  beforeEach(() => {
    streams = Object.values(Level).reduce((streams, level) => {
      return { ...streams, [level.name]: new TestOutputStream() };
    }, {});
  });

  afterEach(() => {
    Object.values(streams).forEach(stream => {return stream.destroy();});
  });

 it('should log messages', () => {
    const ts = new Date();
    const logger = new Logger({
      processors: [
        processors.context(),
        processors.error({ stack: false }),
        processors.timestamp({
          getTimestamp: () => {
            return ts;
          }
        }),
        processors.json(),
      ],
      transports: [
        transports.stream({ streams })
      ],
      level: Level.TRACE,
    });

    logger.trace('Tripitaka traces!', { x: 'y' });
    logger.debug('Tripitaka debugs!', { x: 'y' });
    logger.info('Tripitaka rocks once!', { x: 'y' });
    logger.info('Tripitaka rocks twice!');
    logger.warn('Tripitaka warns!', { x: 'y' });
    logger.error('Tripitaka errors!', new Error('Oooh, Demons!'));

    eq(streams[Level.TRACE.name].lines, [`{"level":"TRACE","message":"Tripitaka traces!","x":"y","timestamp":"${ts.toISOString()}"}`]);
    eq(streams[Level.DEBUG.name].lines, [`{"level":"DEBUG","message":"Tripitaka debugs!","x":"y","timestamp":"${ts.toISOString()}"}`]);
    eq(streams[Level.INFO.name].lines, [
      `{"level":"INFO","message":"Tripitaka rocks once!","x":"y","timestamp":"${ts.toISOString()}"}`,
      `{"level":"INFO","message":"Tripitaka rocks twice!","timestamp":"${ts.toISOString()}"}`
    ]);
    eq(streams[Level.WARN.name].lines, [`{"level":"WARN","message":"Tripitaka warns!","x":"y","timestamp":"${ts.toISOString()}"}`]);
    eq(streams[Level.ERROR.name].lines, [`{"error":{"message":"Oooh, Demons!"},"level":"ERROR","message":"Tripitaka errors!","timestamp":"${ts.toISOString()}"}`]);
  });

  it('should ignore falsy processors', () => {
    const ts = new Date();
    const logger = new Logger({
      processors: [
        processors.error({ stack: false }),
        processors.timestamp({ getTimestamp: () => {
          return ts;
        } }),
        () => {return false;},
        () => {return null;},
        () => {return undefined;},
        processors.json(),
      ],
      transports: [
        transports.stream({ streams })
      ]
    });

    logger.info('Tripitaka rocks!', { x: 'y' });

    eq(streams[Level.INFO.name].lines, [`{"level":"INFO","message":"Tripitaka rocks!","x":"y","timestamp":"${ts.toISOString()}"}`]);
  });

  it('should support being disabled', () => {
    const logger = new Logger({
      transports: [
        transports.stream({ streams })
      ],
    });

    logger.disable();
    logger.info('Tripitaka rocks!', { x: 'y' });
    eq(streams[Level.INFO.name].lines.length, 0);
  });

  it('should support being enabled', () => {
    const logger = new Logger({
      transports: [
        transports.stream({ streams })
      ],
    });

    logger.disable();
    logger.enable();

    logger.info('Tripitaka rocks!', { x: 'y' });
    eq(streams[Level.INFO.name].lines.length, 1);
  });
});