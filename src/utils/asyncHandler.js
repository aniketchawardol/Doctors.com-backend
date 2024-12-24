const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next)
  } catch (error) {
    
    let statusCode = 500;
    
    if (error.name === 'ValidationError') statusCode = 400;
    if (error.name === 'CastError') statusCode = 400;
    if (error.code === 'ENOENT') statusCode = 404;


    res.status(statusCode).json({
      success: false,
      message: error.message,
    })
  }
}

export { asyncHandler }