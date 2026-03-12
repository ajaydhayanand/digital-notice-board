const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || "Server error",
  });
};

module.exports = {
  notFound,
  errorHandler,
};
