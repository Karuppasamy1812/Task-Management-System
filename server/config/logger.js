const timestamp = () => new Date().toISOString();

const logger = {
  info:    (context, message) => console.log(`[${timestamp()}] INFO  [${context}] ${message}`),
  success: (context, message) => console.log(`[${timestamp()}] OK    [${context}] ${message}`),
  warn:    (context, message) => console.warn(`[${timestamp()}] WARN  [${context}] ${message}`),
  error:   (context, message, err) => console.error(`[${timestamp()}] ERROR [${context}] ${message}`, err?.message || ''),
};

export default logger;
