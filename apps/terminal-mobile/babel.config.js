module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Hermes rejects dynamic import() syntax. Convert import(x) to
      // Promise.resolve().then(() => require(x)) before hermesc sees the bundle.
      // All modules are pre-bundled in RN, so this is semantically identical.
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
