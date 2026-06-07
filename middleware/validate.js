export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res
      .status(400)
      .json({
        errors: result.error.flatten().fieldErrors,
        formErrors: result.error.flatten().formErrors,
      });
  }
  req.body = result.data;
  next();
};
