module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Hermes (the static JS compiler) rejects dynamic import() syntax.
      // @supabase/supabase-js uses import(/* webpackIgnore */ OTEL_PKG) for
      // optional OpenTelemetry tracing, which causes a hermesc compile error.
      // This visitor converts every import(x) call into the equivalent
      // Promise.resolve().then(() => require(x)) before hermesc processes the
      // bundle. In React Native all modules are pre-bundled so require() is
      // always synchronous — this is semantically identical at runtime.
      ({ types: t }) => ({
        visitor: {
          CallExpression(path) {
            if (path.node.callee.type === 'Import') {
              path.replaceWith(
                t.callExpression(
                  t.memberExpression(
                    t.callExpression(
                      t.memberExpression(t.identifier('Promise'), t.identifier('resolve')),
                      []
                    ),
                    t.identifier('then')
                  ),
                  [
                    t.arrowFunctionExpression(
                      [],
                      t.callExpression(t.identifier('require'), path.node.arguments)
                    ),
                  ]
                )
              );
            }
          },
        },
      }),
    ],
  };
};
