type FunctionErrorPayload = {
  error?: {
    details?: string;
    message?: string;
  };
};

export function mapAuthErrorMessage(message?: string | null) {
  if (!message) {
    return "Không thể xác thực. Vui lòng thử lại.";
  }

  if (message.includes("Invalid login credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }

  if (message.includes("Email not confirmed")) {
    return "Tài khoản chưa xác nhận email.";
  }

  return "Không thể xác thực. Vui lòng thử lại.";
}

export async function mapFunctionError(response: Response) {
  try {
    const payload = (await response.json()) as FunctionErrorPayload;
    return (
      payload.error?.message ??
      payload.error?.details ??
      "Không thể xử lý yêu cầu với Supabase."
    );
  } catch {
    return "Không thể xử lý yêu cầu với Supabase.";
  }
}
