// Vietnamese error messages mapped by backend error code (numeric) and string key
export const ERROR_MESSAGES: Record<string, string> = {
  // --- System & General ---
  '9999': 'Đã xảy ra lỗi không xác định',
  '1001': 'Yêu cầu không hợp lệ',

  // --- Authentication & User ---
  '1002': 'Tài khoản đã tồn tại',
  '1003': 'Tên đăng nhập quá ngắn',
  '1004': 'Mật khẩu phải có ít nhất 8 ký tự',
  '1005': 'Không tìm thấy người dùng',
  '1006': 'Chưa đăng nhập hoặc phiên đã hết hạn',
  '1007': 'Bạn không có quyền thực hiện thao tác này',
  '1008': 'Email này đã được sử dụng',
  '1009': 'Mật khẩu đã tồn tại',
  '1010': 'Email chưa được xác thực',
  '1011': 'Mã OTP đã hết hạn',
  '1012': 'Tạo hồ sơ thất bại',
  '1013': 'Tài khoản chưa được kích hoạt',
  '1014': 'Tài khoản đã được kích hoạt rồi',
  '1015': 'Tài khoản đã bị vô hiệu hóa rồi',
  '1016': 'Mật khẩu không đúng',

  // --- Validation: Email & Password ---
  '1017': 'Định dạng email không đúng',
  '1018': 'Vui lòng nhập mật khẩu',
  '1019': 'Mật khẩu phải có ít nhất 8 ký tự',
  '1020': 'Mật khẩu phải bao gồm chữ hoa, chữ thường và số',
  '1021': 'Vui lòng nhập họ tên',
  '1022': 'Họ tên phải từ 2-100 ký tự',
  '1023': 'URL avatar không hợp lệ',
  '1024': 'Số điện thoại không hợp lệ',
  '1025': 'Vui lòng nhập ngày sinh',
  '1026': 'Ngày sinh phải trong quá khứ',

  // --- IELTS Specs ---
  '1027': 'Vui lòng nhập band mục tiêu',
  '1028': 'Band IELTS phải từ 0.0 đến 9.0',
  '1029': 'Band IELTS phải theo bước 0.5 (VD: 6.0, 6.5)',

  // --- Roadmap & Study ---
  '1040': 'Không tìm thấy lộ trình học',
  '1041': 'Không tìm thấy bài thi IELTS',
  '1042': 'Không tìm thấy bộ từ vựng',

  // --- Tag ---
  '1043': 'Mã hoặc tên tag đã tồn tại',
  '1044': 'Không tìm thấy tag',

  // --- Practice ---
  '1045': 'Không tìm thấy nội dung bài thi',
  '1046': 'Không tìm thấy câu hỏi',
  '1047': 'Không tìm thấy đáp án',
  '1048': 'Không tìm thấy lần làm bài',

  // --- Legacy string keys (fallback) ---
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
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  USER_EXISTS: 'Email này đã được sử dụng',
  ACCOUNT_BANNED: 'Tài khoản đã bị khóa',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn',
  INVALID_TOKEN: 'Phiên đăng nhập không hợp lệ',
  NETWORK_ERROR: 'Không thể kết nối đến server',
  SERVER_ERROR: 'Lỗi server, vui lòng thử lại sau',
  TIMEOUT: 'Kết nối quá lâu, vui lòng thử lại',
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
    if ('code' in error && typeof (error as Record<string, unknown>).code !== 'undefined') {
      return getErrorMessage((error as Record<string, unknown>).code as number, error.message);
    }
    // Don't return raw English backend messages — use default Vietnamese
    return ERROR_MESSAGES.DEFAULT;
  }

  return ERROR_MESSAGES.DEFAULT;
};
