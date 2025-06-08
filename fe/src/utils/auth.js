const SERVER = import.meta.env.VITE_SERVER || 'https://mirgos.loca.lt';

export async function registerUser(username, password) {
    try {
        const response = await fetch(`${SERVER}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            return { success: false, error: response.statusText };
        }

        const data = await response.json();
        console.log('User registered:', data);
        return { success: true };
    } catch (error) {
        console.error('Error registering user:', error);
        return { success: false, error: error.message };
    }
}

export async function loginUser(username, password) {
    try {
        const response = await fetch(`${SERVER}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        console.log('Login response:', response);
        if (!response.ok) {
            return { success: false, error: response.statusText };
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('playerName', username);
        return { success: true };
    } catch (error) {
        console.error('Error logging in:', error);
        return { success: false, error: error.message };
    }
}

export function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('playerName');
    
    console.log('User logged out');
}