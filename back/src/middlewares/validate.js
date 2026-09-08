export const validate = (schema, source = "body") => (req, _res, next) => {
  const parsed = schema.parse(req[source]);
  if (source === "query") {
    Object.defineProperty(req, "query", { value: parsed, writable: false, configurable: true });
  } else {
    req[source] = parsed;
  }
  next();
};
