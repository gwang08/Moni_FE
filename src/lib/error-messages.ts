// Vietnamese error messages
export const ERROR_MESSAGES: Record<string, string> = {
  // Validation errors
  EMAIL_REQUIRED: 'Vui lòng nhập email',
  INVALID_EMAIL: 'Email không hợp lệ',
  INVALID_EMAIL_FORMAT: 'Định dạng email không đúng',
  PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu',
  PASSWORD_TOO_SHORT: 'Mật khẩu phải có ít nhất 8 ký tự',
  PASSWORD_MIN_8_CHARS: 'Mật khẩu phải có ít nhất 8 ký tự',
  PASSWORD_WEAK: 'Mật khẩu phải bao gồm chữ hoa, chữ thường và số',
  FULL_NAME_REQUIRED: 'Vui lòng nhập họ tên',
  FULL_NAME_LENGTH_INVALID: 'Họ tên phải từ 2-100 ký tự',
  DOB_REQUIRED: 'Vui lòng nhập ngày sinh',
  DOB_MUST_BE_IN_PAST: 'Ngày sinh phải trong quá khứ',
  INVALID_PHONE_NUMBER: 'Số điện thoại không hợp lệ',
  INVALID_AVATAR_URL: 'URL avatar không hợp lệ',

  // Auth errors
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  USER_EXISTS: 'Email này đã được sử dụng',
  ACCOUNT_BANNED: 'Tài khoản đã bị khóa',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn',
  INVALID_TOKEN: 'Phiên đăng nhập không hợp lệ',

  // Network errors
  NETWORK_ERROR: 'Không thể kết nối đến server',
  SERVER_ERROR: 'Lỗi server, vui lòng thử lại sau',
  TIMEOUT: 'Kết nối quá lâu, vui lòng thử lại',

  // Default
  DEFAULT: 'Đã xảy ra lỗi, vui lòng thử lại',
};

export const getErrorMessage = (
  code: string | number | undefined,
  fallback?: string
): string => {
  if (!code) return fallback || ERROR_MESSAGES.DEFAULT;

  const key = String(code).toUpperCase();
  return ERROR_MESSAGES[key] || fallback || ERROR_MESSAGES.DEFAULT;
};

// Helper for API errors
export const formatApiError = (error: unknown): string => {
  if (error instanceof Error) {
    // Check if it's ApiError with code
    if ('code' in error && typeof error.code === 'number') {
      return getErrorMessage(error.code, error.message);
    }
    return error.message;
  }

  return ERROR_MESSAGES.DEFAULT;
};
