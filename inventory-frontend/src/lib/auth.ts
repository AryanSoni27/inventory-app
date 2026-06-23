import Cookies from 'js-cookie';

export const setToken = (token: string) => {
  Cookies.set('token', token, { expires: 1 }); // 1 day
};

export const getToken = (): string | undefined => {
  return Cookies.get('token');
};

export const removeToken = () => {
  Cookies.remove('token');
};

export const setUserInfo = (username: string, role: string) => {
  Cookies.set('username', username, { expires: 1 });
  Cookies.set('role', role, { expires: 1 });
};

export const getUserInfo = () => {
  return {
    username: Cookies.get('username') || '',
    role: Cookies.get('role') || '',
  };
};

export const clearAuth = () => {
  Cookies.remove('token');
  Cookies.remove('username');
  Cookies.remove('role');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
