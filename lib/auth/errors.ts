const ERROR_MESSAGES: Record<string, string> = {
  nickname_required: '请输入昵称',
  user_not_found: '该昵称未注册，请先注册',
  nickname_taken: '昵称已被占用，请换一个',
  nickname_invalid: '昵称长度需在 2～20 个字符之间',
  supabase_unavailable: '服务未连接，请确认 Supabase 环境变量已配置',
  login_failed: '登录失败，请重试',
  register_failed: '注册失败，请重试',
};

export function authErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? code;
}
