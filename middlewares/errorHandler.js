/**
 * Global Error Handler Middleware
 * Bắt tất cả các lỗi văng ra từ hệ thống và định tuyến trả về JSON hoặc HTML tùy loại Request.
 */
function errorHandler(err, req, res, next) {
  console.error('[Global Error]', err.stack || err.message || err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Nếu là API request (AJAX, fetch, URL bắt đầu bằng /api) thì trả JSON
  if (req.xhr || req.path.startsWith('/api') || req.headers['accept']?.includes('application/json')) {
    return res.status(status).json({
      success: false,
      error: message
    });
  }

  // Nếu là load trang bình thường thì render màn hình lỗi
  res.locals.message = message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(status);
  res.render('error');
}

module.exports = errorHandler;
